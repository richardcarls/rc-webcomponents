/** @typedef { import('@yarnpkg/types').Yarn.Constraints.Context } Context */

const { defineConfig } = require("@yarnpkg/types");

module.exports = defineConfig({
  // Enforce consistent dependency version for shared deps
  async constraints(ctx) {
    enforcePrivateFlag(ctx);
    enforceSharedDepVersions(ctx);
  },
});

/**
 * Rule to force all workspaces private
 *
 * @param {Context} ctx
 */
const enforcePrivateFlag = async ({ Yarn }) => {
  for (const workspace of Yarn.workspaces()) {
    workspace.set("private", true);
  }
};

/**
 * Rule to update shared dependencies across workspaces to the same version
 *
 * @param {Context} ctx
 */
function enforceSharedDepVersions({ Yarn }) {
  const root = Yarn.workspace({ ident: "@rcarls/workspace-root" }) ?? undefined;

  for (const dependency of Yarn.dependencies()) {
    if (dependency.type === `peerDependencies`) continue;

    const rootDep = Yarn.dependencies({
      workspace: root,
      ident: dependency.ident,
    }).at(0);

    if (rootDep) dependency.update(rootDep.range);
  }
}
