/**
 * ESLint Plugin: Infæmous Freight Error Handling
 * 
 * Custom rules to enforce error handling patterns in Express routes.
 */

module.exports = {
    rules: {
        /**
         * Rule: require-trycatch-next
         * Enforce try/catch with next(err) in async route handlers
         */
        'require-trycatch-next': {
            meta: {
                type: 'problem',
                docs: {
                    description: 'Enforce try/catch with next(err) in async route handlers',
                    category: 'Best Practices',
                    recommended: true,
                },
                messages: {
                    missingTryCatch: 'Async route handler must have try/catch block',
                    missingNext: 'Catch block must call next(err) to delegate to error handler',
                    emptyTryCatch: 'Try/catch block cannot be empty',
                },
                schema: [], // no options
            },
            create(context) {
                function isRouteHandler(node) {
                    // Check if function has (req, res) or (req, res, next) signature
                    if (!node.params || node.params.length < 2) return false;
                    
                    const paramNames = node.params.map(p => p.name || '');
                    return (
                        paramNames[0] === 'req' &&
                        paramNames[1] === 'res'
                    );
                }
                
                function hasTryCatch(node) {
                    if (!node.body || !node.body.body) return false;
                    return node.body.body.some(stmt => stmt.type === 'TryStatement');
                }
                
                function hasNextInCatch(tryStatement) {
                    if (!tryStatement.handler || !tryStatement.handler.body) return false;
                    
                    const catchBody = tryStatement.handler.body.body;
                    return catchBody.some(stmt => {
                        if (stmt.type !== 'ExpressionStatement') return false;
                        if (stmt.expression.type !== 'CallExpression') return false;
                        return stmt.expression.callee.name === 'next';
                    });
                }
                
                return {
                    // Check arrow functions: async (req, res, next) => {}
                    ArrowFunctionExpression(node) {
                        if (!node.async || !isRouteHandler(node)) return;
                        
                        if (!hasTryCatch(node)) {
                            context.report({
                                node,
                                messageId: 'missingTryCatch',
                            });
                            return;
                        }
                        
                        const tryStatement = node.body.body.find(
                            stmt => stmt.type === 'TryStatement'
                        );
                        
                        if (tryStatement && !hasNextInCatch(tryStatement)) {
                            context.report({
                                node: tryStatement.handler,
                                messageId: 'missingNext',
                            });
                        }
                    },
                    
                    // Check regular functions: async function handler(req, res, next) {}
                    FunctionExpression(node) {
                        if (!node.async || !isRouteHandler(node)) return;
                        
                        if (!hasTryCatch(node)) {
                            context.report({
                                node,
                                messageId: 'missingTryCatch',
                            });
                            return;
                        }
                        
                        const tryStatement = node.body.body.find(
                            stmt => stmt.type === 'TryStatement'
                        );
                        
                        if (tryStatement && !hasNextInCatch(tryStatement)) {
                            context.report({
                                node: tryStatement.handler,
                                messageId: 'missingNext',
                            });
                        }
                    },
                };
            },
        },
        
        /**
         * Rule: no-direct-error-response
         * Disallow direct res.status().json() in catch blocks
         */
        'no-direct-error-response': {
            meta: {
                type: 'problem',
                docs: {
                    description: 'Disallow direct res.status().json() in catch blocks',
                    category: 'Best Practices',
                    recommended: true,
                },
                messages: {
                    directErrorResponse: 'Use next(err) instead of res.status().json() in catch block. Delegate to error handler middleware.',
                    directSend: 'Use next(err) instead of res.send() or res.json() in catch block.',
                },
                schema: [],
            },
            create(context) {
                let catchDepth = 0;
                
                return {
                    CatchClause() {
                        catchDepth++;
                    },
                    'CatchClause:exit'() {
                        catchDepth--;
                    },
                    CallExpression(node) {
                        if (catchDepth === 0) return;
                        
                        // Check for res.status().json()
                        if (
                            node.callee.type === 'MemberExpression' &&
                            node.callee.property.name === 'json' &&
                            node.callee.object.type === 'CallExpression' &&
                            node.callee.object.callee.type === 'MemberExpression' &&
                            node.callee.object.callee.property.name === 'status' &&
                            node.callee.object.callee.object.name === 'res'
                        ) {
                            context.report({
                                node,
                                messageId: 'directErrorResponse',
                            });
                            return;
                        }
                        
                        // Check for res.json() or res.send()
                        if (
                            node.callee.type === 'MemberExpression' &&
                            node.callee.object.name === 'res' &&
                            (node.callee.property.name === 'json' || node.callee.property.name === 'send')
                        ) {
                            context.report({
                                node,
                                messageId: 'directSend',
                            });
                        }
                    },
                };
            },
        },
        
        /**
         * Rule: require-api-response
         * Require ApiResponse wrapper for success responses
         */
        'require-api-response': {
            meta: {
                type: 'suggestion',
                docs: {
                    description: 'Require ApiResponse wrapper for success responses',
                    category: 'Best Practices',
                    recommended: false,
                },
                messages: {
                    requireApiResponse: 'Use ApiResponse wrapper: res.json(new ApiResponse({success: true, data: ...}))',
                },
                schema: [],
            },
            create(context) {
                return {
                    CallExpression(node) {
                        // Check for res.json()
                        if (
                            node.callee.type !== 'MemberExpression' ||
                            node.callee.object.name !== 'res' ||
                            node.callee.property.name !== 'json'
                        ) {
                            return;
                        }
                        
                        // Skip if inside catch block (should use next(err) anyway)
                        const ancestors = context.getAncestors();
                        const inCatch = ancestors.some(a => a.type === 'CatchClause');
                        if (inCatch) return;
                        
                        // Check if argument is `new ApiResponse(...)`
                        const arg = node.arguments[0];
                        if (!arg) return;
                        
                        const isApiResponse =
                            arg.type === 'NewExpression' &&
                            arg.callee.name === 'ApiResponse';
                        
                        if (!isApiResponse) {
                            context.report({
                                node,
                                messageId: 'requireApiResponse',
                            });
                        }
                    },
                };
            },
        },
    },
};
