/**
 * Custom ESLint Configuration for Error Handling Enforcement
 * 
 * This configuration enforces proper error handling patterns in Express routes:
 * - All async functions must use try/catch with next(err)
 * - All errors must be delegated to error handler middleware
 * - No direct res.status().json() in catch blocks
 * - Consistent ApiResponse usage for success responses
 * 
 * Usage: npx eslint --config .eslintrc-error-handling.js apps/api/src/routes/**/*.js
 */

module.exports = {
    parser: '@babel/eslint-parser',
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        requireConfigFile: false,
    },
    env: {
        node: true,
        es2021: true,
        jest: true,
    },
    extends: ['eslint:recommended'],
    rules: {
        // Enforce try/catch in async route handlers
        'no-async-without-trycatch': 'off', // Custom rule defined below
        
        // Disallow direct error responses in catch blocks
        'no-catch-error-response': 'error',
        
        // Require next(err) in catch blocks
        'require-next-error': 'error',
        
        // Require ApiResponse for success responses
        'require-api-response': 'warn',
        
        // Standard rules
        'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
    plugins: ['infamous-freight-error-handling'],
    overrides: [
        {
            files: ['apps/api/src/routes/**/*.js'],
            rules: {
                'infamous-freight-error-handling/require-trycatch-next': 'error',
                'infamous-freight-error-handling/no-direct-error-response': 'error',
            },
        },
    ],
};

/**
 * Custom ESLint Plugin for Error Handling
 * 
 * Install in project:
 * 1. Create plugins/eslint-plugin-infamous-freight-error-handling/index.js
 * 2. Add to package.json: "eslint-plugin-infamous-freight-error-handling": "file:./plugins/eslint-plugin-infamous-freight-error-handling"
 * 3. Run: pnpm install
 */

// Note: This is a configuration file. The actual plugin implementation
// should be created in: plugins/eslint-plugin-infamous-freight-error-handling/

/* 
Plugin Implementation (create separate file):

module.exports = {
    rules: {
        'require-trycatch-next': {
            meta: {
                type: 'problem',
                docs: {
                    description: 'Enforce try/catch with next(err) in async route handlers',
                },
                messages: {
                    missingTryCatch: 'Async route handler must have try/catch block',
                    missingNext: 'Catch block must call next(err) to delegate to error handler',
                },
            },
            create(context) {
                return {
                    ArrowFunctionExpression(node) {
                        // Check if this is an async route handler: async (req, res, next) => {}
                        if (node.async && node.params.length === 3) {
                            const bodyStatements = node.body.body;
                            const hasTryCatch = bodyStatements && bodyStatements.some(
                                stmt => stmt.type === 'TryStatement'
                            );
                            
                            if (!hasTryCatch) {
                                context.report({
                                    node,
                                    messageId: 'missingTryCatch',
                                });
                            }
                            
                            // Check if catch block calls next(err)
                            const tryStatement = bodyStatements && bodyStatements.find(
                                stmt => stmt.type === 'TryStatement'
                            );
                            if (tryStatement) {
                                const catchBlock = tryStatement.handler;
                                if (catchBlock) {
                                    const hasNext = catchBlock.body.body.some(stmt => {
                                        return stmt.type === 'ExpressionStatement' &&
                                               stmt.expression.type === 'CallExpression' &&
                                               stmt.expression.callee.name === 'next';
                                    });
                                    
                                    if (!hasNext) {
                                        context.report({
                                            node: catchBlock,
                                            messageId: 'missingNext',
                                        });
                                    }
                                }
                            }
                        }
                    },
                };
            },
        },
        
        'no-direct-error-response': {
            meta: {
                type: 'problem',
                docs: {
                    description: 'Disallow direct res.status().json() in catch blocks',
                },
                messages: {
                    directErrorResponse: 'Use next(err) instead of res.status().json() in catch block',
                },
            },
            create(context) {
                let inCatchBlock = false;
                
                return {
                    CatchClause(node) {
                        inCatchBlock = true;
                    },
                    'CatchClause:exit'() {
                        inCatchBlock = false;
                    },
                    CallExpression(node) {
                        if (inCatchBlock) {
                            // Check for res.status().json() pattern
                            if (
                                node.callee.type === 'MemberExpression' &&
                                node.callee.property.name === 'json' &&
                                node.callee.object.type === 'CallExpression' &&
                                node.callee.object.callee.property &&
                                node.callee.object.callee.property.name === 'status'
                            ) {
                                context.report({
                                    node,
                                    messageId: 'directErrorResponse',
                                });
                            }
                        }
                    },
                };
            },
        },
    },
};
*/
