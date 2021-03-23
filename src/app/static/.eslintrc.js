module.exports = {
    root: true,
    parser: "vue-eslint-parser",
    parserOptions: {
        "parser": "@typescript-eslint/parser"
    },
    plugins: [
        "@typescript-eslint"
    ],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:vue/essential"
    ],
    rules: {
        "consistent-this": ["self"],
        "no-prototype-builtins": "off",
        // this is just a rule to enforce nesting script tags in vue templates
        // unfortunately it doesn't understand typescript AST so won't enforce any other
        // code indentation rules in Vue script tags
        // https://eslint.vuejs.org/rules/script-indent.html
        "vue/script-indent": ["error", 4, {
            "baseIndent": 1,
            "ignores": [
                // nested objects, excluding top level of exported object (data, methods, computed, etc.)
                "[value.type='ObjectExpression']:not(:matches(ExportDefaultDeclaration, [left.property.name='exports']) > * > [value.type='ObjectExpression'])",
                // nested arrays
                "[value.type='ArrayExpression']"
            ]
        }]
    }
};
