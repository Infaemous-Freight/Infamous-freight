/**
 * Error Handling Enforcement Linting Rule
 * 
 * This custom ESLint rule ensures all async route handlers properly
 * delegate errors to the global error handler via next(err)
 * 
 * ❌ WRONG:
 *   res.status(500).json({ error: err.message });
 * 
 * ✅ CORRECT:
 *   catch (err) { next(err); }
 */

module.exports = {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Enforce proper error handling in Express routes - must use next(err) in catch blocks, not direct responses',
            category: 'Best Practices',
            recommended: true,
        },
        fixable: 'code',
        schema: [],
    },

    create(context) {
        const sourceCode = context.getSourceCode();

        return {
            // Check for direct error responses in route handlers
            CallExpression(node) {
                // Pattern: res.status(...).json()
                if (
                    node.callee?.object?.property?.name === 'json' &&
                    node.callee?.object?.object?.property?.name === 'status' &&
                    sourceCode
                        .getTokensBefore(node)
                        .some((t) => t.value === 'catch' || t.value === 'error')
                ) {
                    context.report({
                        node,
                        message:
                            'Direct error response detected. Use next(err) instead to delegate to global error handler',
                        fix(fixer) {
                            return fixer.replaceText(
                                node.parent,
                                'next(err);  // Delegate to errorHandler middleware'
                            );
                        },
                    });
                }

                // Pattern: res.json({ error: err.message })
                if (
                    node.callee?.property?.name === 'json' &&
                    node.callee?.object?.name === 'res' &&
                    node.arguments?.[0]?.properties?.some((p) => p.key?.name === 'error')
                ) {
                    const inCatch = sourceCode
                        .getTokensBefore(node)
                        .some((t) => t.value === 'catch');

                    if (inCatch) {
                        context.report({
                            node,
                            message:
                                'Avoid inline error response in catch blocks. Always use next(err) to ensure consistent error handling and logging',
                        });
                    }
                }

                // Pattern: throw new Error or similar in routes without try/catch
                if (
                    node.callee?.name === 'Error' &&
                    !isInsideTryCatch(node, sourceCode)
                ) {
                    context.report({
                        node,
                        message:
                            'Errors in routes must be caught and passed to next(err). Use try/catch blocks.',
                    });
                }
            },

            // Ensure catch blocks use next(err)
            CatchClause(node) {
                const catchBody = node.body;
                if (!catchBody.body || catchBody.body.length === 0) {
                    return;
                }

                const firstStatement = catchBody.body[0];
                const usesNext = sourceCode
                    .getText(catchBody)
                    .includes('next(err)') || sourceCode.getText(catchBody).includes('next(error)');

                if (!usesNext) {
                    // Check if it's a route handler (function inside app.get/post/etc)
                    const parent = node.parent;
                    if (
                        parent?.type === 'ArrowFunctionExpression' &&
                        checkIfRouteHandler(parent, sourceCode)
                    ) {
                        context.report({
                            node: catchBody,
                            message:
                                'Catch block should delegate to next(err). Did not find next(err) or next(error) call.',
                            fix(fixer) {
                                const existingCode = sourceCode.getText(catchBody);
                                // Add next(err) if minimal catch block
                                if (existingCode === '{ }') {
                                    return fixer.replaceText(catchBody, '{ next(err); }');
                                }
                            },
                        });
                    }
                }
            },
        };

        /**
         * Check if a node is inside a try/catch
         */
        function isInsideTryCatch(node, sourceCode) {
            let current = node;
            while (current) {
                if (current.type === 'TryStatement') {
                    return true;
                }
                current = current.parent;
            }
            return false;
        }

        /**
         * Check if a function is a route handler
         * (has parameters like req, res, next)
         */
        function checkIfRouteHandler(node, sourceCode) {
            const params = node.params || [];
            return (
                params.length >= 2 &&
                params.some((p) => p.name === 'req' || p.name === 'request') &&
                params.some((p) => p.name === 'res' || p.name === 'response')
            );
        }
    },
};
