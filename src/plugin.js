const _ = require("lodash");

const { i18nextImportStatement } = require("./frozen-asts");

const { getUniqueKeyFromFreeText, LutManager } = require("./lut");

const {
  isBlacklistedForJsxAttribute,
  handleConditionalExpressions,
} = require("./plugin-helpers");

const isValid = text => {
  return text.length && text.length > 2 && text.match(".*[a-zA-Z]+.*");
};

const handleStringLiteral = (path, table, key) => {
  const { value } = path.node;
  if (!table[key]) table[key] = {};
  if (!table[key].pairs) table[key].pairs = [];
  table[key].pairs.push({ path, value });
};

const extractValueAndUpdateTable = (t, table, path, key) => {
  if (t.isStringLiteral(path.node)) {
    handleStringLiteral(path, table, key);
  }
};

module.exports = ({ types: t }) => ({
  name: "i18ize-react",
  visitor: {
    Program: {
      enter() {
        this.i18State = {};
        this.alreadyImportedi18n = false;
        LutManager.resetGetUniqueKeyFromFreeTextNumCalls();
      },
      exit(programPath) {
        Object.keys(this.i18State).forEach(key => {
          if (this.i18State[key].valid && this.i18State[key].pairs) {
            this.i18State[key].pairs.forEach(({ path, value }) => {
              const kValue = getUniqueKeyFromFreeText(value, this.fileName);

              path.replaceWithSourceString(`i18n.t('${kValue}')`);
            });
          }
        });
        // Do not add imports if there is no replaceable text
        // in this file
        if (LutManager.getUniqueKeyFromFreeTextNumCalls > 0) {
          if (!this.alreadyImportedi18n) {
            programPath.node.body.unshift(_.cloneDeep(i18nextImportStatement));
          }
          LutManager.addPath(this.fileName);
        }
      },
    },
    ImportDeclaration: {
      enter(path) {
        if (path.node.source.value.match(/^i18next$/)) {
          this.alreadyImportedi18n = true;
        }
      },
    },
    Identifier: {
      enter(path) {
        // Only extract the value of identifiers
        // who are children of some JSX element
        if (path.findParent(p => p.isJSXElement())) {
          this.i18State[path.node.name] = _.merge(
            this.i18State[path.node.name],
            {
              valid: true,
            },
          );
        }
      },
    },
    TemplateLiteral: {
      enter(path) {
        // Only extract the value of identifiers
        // who are children of some JSX element
        const firstJsxParent = path.findParent(p => p.isJSXElement());
        if (!firstJsxParent) return;

        // Ignore CSS strings
        if (_.get(firstJsxParent, "node.openingElement.name.name") === "style")
          return;

        if (isBlacklistedForJsxAttribute(path)) return;

        const { expressions, quasis } = path.node;
        expressions.forEach(expression => {
          const key = expression.name;
          this.i18State[key] = _.merge(this.i18State[key], { valid: true });
        });
        quasis.forEach((templateElement, index) => {
          const coreValue = templateElement.value.raw.trim();
          if (coreValue.length && coreValue.length > 3 && isValid(coreValue)) {
            const qPath = path.get("quasis")[index];
            const kValue = getUniqueKeyFromFreeText(coreValue, this.fileName);
            // TODO: OPTIMIZATION: Use quasi quotes to optimize this
            // TODO: Replace the path instead of modifying the raw
            qPath.node.value.raw = qPath.node.value.raw.replace(
              coreValue,
              `\${i18n.t('${kValue}')}`,
            );
            qPath.node.value.cooked = qPath.node.value.cooked.replace(
              coreValue,
              `\${i18n.t('${kValue}')}`,
            );
          }
        });
      },
    },
    AssignmentExpression: {
      enter(path) {
        return;
        // const key = _.get(
        //   path,
        //   "node.left.name",
        //   _.get(path, "node.left.property.name")
        // );
        // if (!key) return;
        // extractValueAndUpdateTable(t, this.i18State, path.get("right"), key);
      },
    },
    ObjectProperty: {
      enter(path) {
        return;
        // const key = _.get(path, "node.key.name");
        // if (!key) return;

        // // Check for blacklist
        // if (isBlacklistedForJsxAttribute(path)) return;

        // extractValueAndUpdateTable(t, this.i18State, path.get("value"), key);
      },
    },
    VariableDeclarator: {
      enter(path) {
        return;
        // TODO: Explore the reason behind crash
        // const key = _.get(path, "node.id.name");
        // if (!key) return;

        // // Check for blacklist
        // if (isBlacklistedForJsxAttribute(path)) return;

        // extractValueAndUpdateTable(t, this.i18State, path.get("init"), key);
      },
    },
    JSXText: {
      enter(path) {
        const coreValue = _.get(path, "node.value", "").trim();
        if (!isValid(coreValue)) {
          return;
        }
        const kValue = getUniqueKeyFromFreeText(coreValue, this.fileName);
        // TODO: OPTIMIZATION: Use quasi quotes to optimize this
        path.node.value = path.node.value.replace(
          coreValue,
          `{i18n.t('${kValue}')}`,
        );
      },
    },
    StringLiteral: {
      enter(path, state) {
        return;
        handleConditionalExpressions(path);
      },
    },
  },
});
