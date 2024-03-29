import * as vscode from 'vscode';
import { StateConfiguration } from './stateConfiguration';
import { Cli } from './providers/Cli';
import { QuickAccessListProvider } from './providers/QuickAccessList';
import { deleteFlagInputBox, flagInputBox } from './menu/FlagMenu';
import { FlagItem, FlagListProvider } from './providers/FlagList';
import {
  deleteCampaignBox,
  deleteProjectInputBox,
  deleteVariationBox,
  deleteVariationGroupBox,
  projectInputBox,
} from './menu/ProjectMenu';
import {
  CampaignItem,
  ProjectItem,
  ProjectListProvider,
  VariationGroupItem,
  VariationItem,
} from './providers/ProjectList';
import { FileAnalyzedProvider, FlagAnalyzed } from './providers/FlagAnalyzeList';
import { deleteTargetingKeyInputBox, targetingKeyInputBox } from './menu/TargetingKeyMenu';
import { TargetingKeyItem, TargetingKeyListProvider } from './providers/TargetingKeyList';
import { deleteGoalInputBox, goalInputBox } from './menu/GoalMenu';
import { GoalItem, GoalListProvider } from './providers/GoalList';
import FlagshipCompletionProvider from './providers/FlagshipCompletion';
import FlagshipHoverProvider from './providers/FlagshipHover';
import {
  ADD_FLAG,
  CAMPAIGN_LIST_COPY,
  CAMPAIGN_LIST_DELETE,
  CAMPAIGN_LIST_OPEN_IN_BROWSER,
  FIND_IN_FILE,
  FLAGSHIP_CREATE_FLAG,
  FLAGSHIP_CREATE_GOAL,
  FLAGSHIP_CREATE_PROJECT,
  FLAGSHIP_CREATE_TARGETING_KEY,
  FLAGSHIP_GET_TOKEN_SCOPE,
  FLAGSHIP_OPEN_BROWSER,
  FLAG_IN_FILE_REFRESH,
  FLAG_LIST_COPY,
  FLAG_LIST_DELETE,
  FLAG_LIST_EDIT,
  FLAG_LIST_LOAD,
  GOAL_LIST_DELETE,
  GOAL_LIST_EDIT,
  GOAL_LIST_LOAD,
  LIST_FLAG_IN_WORKSPACE,
  PROJECT_LIST_COPY,
  PROJECT_LIST_DELETE,
  PROJECT_LIST_EDIT,
  PROJECT_LIST_LOAD,
  SET_CONTEXT,
  TARGETING_KEY_LIST_DELETE,
  TARGETING_KEY_LIST_EDIT,
  TARGETING_KEY_LIST_LOAD,
  VARIATION_GROUP_LIST_COPY,
  VARIATION_GROUP_LIST_DELETE,
  VARIATION_LIST_COPY,
  VARIATION_LIST_DELETE,
} from './commands/const';
import { DEFAULT_BASE_URI, PERMISSION_DENIED } from './const';
import { Configuration, Scope } from './model';
import { FlagStore } from './store/FlagStore';
import { ProjectStore } from './store/ProjectStore';
import { TargetingKeyStore } from './store/TargetingKeyStore';
import { GoalStore } from './store/GoalStore';
import { GLOBAL_CURRENT_CONFIGURATION } from './services/const';

const documentSelector: vscode.DocumentSelector = [
  {
    scheme: 'file',
    language: 'typescript',
  },
  {
    scheme: 'file',
    language: 'javascript',
  },
  {
    scheme: 'file',
    language: 'typescriptreact',
  },
  {
    scheme: 'file',
    language: 'java',
  },
  {
    scheme: 'file',
    language: 'javascriptreact',
  },
  {
    scheme: 'file',
    language: 'go',
  },
  {
    scheme: 'file',
    language: 'objective-c',
  },
  {
    scheme: 'file',
    language: 'php',
  },
  {
    scheme: 'file',
    language: 'python',
  },
  {
    scheme: 'file',
    language: 'vb',
  },
  {
    scheme: 'file',
    language: 'csharp',
  },
  {
    scheme: 'file',
    language: 'fsharp',
  },
  {
    scheme: 'file',
    language: 'swift',
  },
  {
    scheme: 'file',
    language: 'dart',
  },
  {
    scheme: 'file',
    language: 'kotlin',
  },
];

export const isGetFlagFunction = (linePrefix: string): boolean =>
  (!!linePrefix.match(/getFlag\(\s*["'][\w\-\_]*/g) && !linePrefix.match(/getFlag\(\s*["'][\w\-\_]*["']/g)) ||
  (!!linePrefix.match(/getModification\(\s*["'][\w\-\_]*/g) &&
    !linePrefix.match(/getModification\(\s*["'][\w\-\_]*["']/g)) ||
  (!!linePrefix.match(/get_modification\(\s*["'][\w\-\_]*/g) &&
    !linePrefix.match(/get_modification\(\s*["'][\w\-\_]*["']/g)) ||
  (!!linePrefix.match(/GetModification(String|Number|Bool|Object|Array)\(\s*["'][\w\-\_]*/g) &&
    !linePrefix.match(/GetModification(String|Number|Bool|Object|Array)\(\s*["'][\w\-\_]*["']/g)) ||
  (!!linePrefix.match(/GetModification\(\s*["'][\w\-\_]*/g) &&
    !linePrefix.match(/GetModification\(\s*["'][\w\-\_]*["']/g)) ||
  (!!linePrefix.match(/GetFlag\(\s*["'][\w\-\_]*/g) && !linePrefix.match(/GetFlag\(\s*["'][\w\-\_]*["']/g)) ||
  (!!linePrefix.match(/useFsFlag\(\s*["'][\w\-\_]*/g) && !linePrefix.match(/useFsFlag\(\s*["'][\w\-\_]*["']/g)) ||
  (!!linePrefix.match(/getModification:\s*@\s*["'][\w\-\_]*/g) &&
    !linePrefix.match(/getModification:\s*@\s*["'][\w\-\_]*["']/g)) ||
  (!!linePrefix.match(/getFlagWithKey:\s*@\s*["'][\w\-\_]*/g) &&
    !linePrefix.match(/getFlagWithKey:\s*@\s*["'][\w\-\_]*["']/g)) ||
  (!!linePrefix.match(/getFlag\(\s*key\s*:\s*["'][\w\-\_]*/g) &&
    !linePrefix.match(/getFlag\(\s*key\s*:\s*["'][\w\-\_]*["']/g));

export const rootPath =
  vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : undefined;

export async function setupProviders(context: vscode.ExtensionContext, stateConfig: StateConfiguration, cli: Cli) {
  const configured = await context.globalState.get('FSConfigured');

  const flagStore = new FlagStore(context, cli);
  const projectStore = new ProjectStore(context, cli);
  const targetingKeyStore = new TargetingKeyStore(context, cli);
  const goalStore = new GoalStore(context, cli);

  if (configured === true) {
    await vscode.commands.executeCommand(SET_CONTEXT, 'flagship:enableFlagshipExplorer', true);
  }

  const quickAccessView = new QuickAccessListProvider(stateConfig);
  const quickAccessProvider = vscode.window.registerTreeDataProvider('quickAccess', quickAccessView);

  const fileAnalyzedProvider = new FileAnalyzedProvider(context, rootPath, cli);
  const flagFileProvider = vscode.window.registerTreeDataProvider('flagsInFile', fileAnalyzedProvider);

  const projectProvider = new ProjectListProvider(context, projectStore);
  vscode.window.registerTreeDataProvider('projectList', projectProvider);

  const flagListProvider = new FlagListProvider(context, flagStore);
  vscode.window.registerTreeDataProvider('flagList', flagListProvider);

  const targetingKeyProvider = new TargetingKeyListProvider(context, targetingKeyStore);
  vscode.window.registerTreeDataProvider('targetingKeyList', targetingKeyProvider);

  const goalProvider = new GoalListProvider(context, goalStore);
  vscode.window.registerTreeDataProvider('goalList', goalProvider);

  await Promise.all([
    quickAccessView.refresh(),
    fileAnalyzedProvider.refresh(),
    projectProvider.refresh(),
    flagListProvider.refresh(),
    targetingKeyProvider.refresh(),
    goalProvider.refresh(),
  ]);

  vscode.commands.registerCommand(FLAGSHIP_OPEN_BROWSER, (link: string) => {
    vscode.env.openExternal(vscode.Uri.parse(link));
  });

  const getTokenInfo = vscode.commands.registerCommand(FLAGSHIP_GET_TOKEN_SCOPE, async () => {
    const tokenInfo = await cli.GetTokenInfo();
    const scopes: any = {};
    tokenInfo.scope.split(' ').map((s) => {
      if (s.includes('.')) {
        const key = s.split('.');
        scopes[key[0]] = [...(scopes[key[0]] || []), key[1]];
        return;
      }
      const key = s.split(':');
      scopes[key[0]] = [...(scopes[key[0]] || []), key[1]];
    });
    const sc: Scope = JSON.parse(JSON.stringify(scopes));
    vscode.window.showInformationMessage(JSON.stringify(sc, null, 2), { modal: true });
  });

  const createProject = vscode.commands.registerCommand(FLAGSHIP_CREATE_PROJECT, async () => {
    const { scope } = context.globalState.get(GLOBAL_CURRENT_CONFIGURATION) as Configuration;
    if (scope?.includes('project.create')) {
      const project = new ProjectItem();
      await projectInputBox(project, projectStore);
      await vscode.commands.executeCommand(PROJECT_LIST_LOAD);
      return;
    }
    vscode.window.showWarningMessage(PERMISSION_DENIED);
    return;
  });

  /*   const createCampaign = vscode.commands.registerCommand(CAMPAIGN_LIST_ADD_CAMPAIGN, async (project: ProjectItem) => {
    await cli.CreateCampaign(project.id!);
    await vscode.commands.executeCommand(PROJECT_LIST_REFRESH);
  }); 
  */

  const createFlag = vscode.commands.registerCommand(FLAGSHIP_CREATE_FLAG, async (flagKey: string | undefined) => {
    const { scope } = context.globalState.get(GLOBAL_CURRENT_CONFIGURATION) as Configuration;

    if (scope?.includes('flag.create')) {
      const flag = new FlagItem();
      if (flagKey) {
        flag.key = flagKey;
      }
      await flagInputBox(flag, flagStore);
      await vscode.commands.executeCommand(FLAG_LIST_LOAD);
      return;
    }
    vscode.window.showWarningMessage(PERMISSION_DENIED);
    return;
  });

  const createTargetingKey = vscode.commands.registerCommand(FLAGSHIP_CREATE_TARGETING_KEY, async () => {
    const { scope } = context.globalState.get(GLOBAL_CURRENT_CONFIGURATION) as Configuration;
    if (scope?.includes('targeting_key.create')) {
      const targetingKey = new TargetingKeyItem();
      await targetingKeyInputBox(targetingKey, targetingKeyStore);
      await vscode.commands.executeCommand(TARGETING_KEY_LIST_LOAD);
      return;
    }
    vscode.window.showWarningMessage(PERMISSION_DENIED);
    return;
  });

  const createGoal = vscode.commands.registerCommand(FLAGSHIP_CREATE_GOAL, async () => {
    const { scope } = context.globalState.get(GLOBAL_CURRENT_CONFIGURATION) as Configuration;
    if (scope?.includes('goal.create')) {
      const goal = new GoalItem();
      await goalInputBox(goal, goalStore);
      await vscode.commands.executeCommand(GOAL_LIST_LOAD);
      return;
    }
    vscode.window.showWarningMessage(PERMISSION_DENIED);
    return;
  });

  const projectDisposables = [
    vscode.commands.registerCommand(PROJECT_LIST_COPY, async (project: ProjectItem) => {
      vscode.env.clipboard.writeText(project.id!);
      vscode.window.showInformationMessage(`[Flagship] Project: ${project.name}'s ID copied to your clipboard.`);
    }),

    vscode.commands.registerCommand(PROJECT_LIST_EDIT, async (project: ProjectItem) => {
      const { scope } = context.globalState.get(GLOBAL_CURRENT_CONFIGURATION) as Configuration;
      if (scope?.includes('project.update')) {
        await projectInputBox(project, projectStore);
        await vscode.commands.executeCommand(PROJECT_LIST_LOAD);
        return;
      }
      vscode.window.showWarningMessage(PERMISSION_DENIED);
      return;
    }),

    vscode.commands.registerCommand(PROJECT_LIST_DELETE, async (project: ProjectItem) => {
      const { scope } = context.globalState.get(GLOBAL_CURRENT_CONFIGURATION) as Configuration;
      if (scope?.includes('project.delete')) {
        await deleteProjectInputBox(project, projectStore);
        await vscode.commands.executeCommand(PROJECT_LIST_LOAD);
        return;
      }
      vscode.window.showWarningMessage(PERMISSION_DENIED);
      return;
    }),
  ];

  const campaignDisposables = [
    vscode.commands.registerCommand(CAMPAIGN_LIST_COPY, async (campaign: CampaignItem) => {
      vscode.env.clipboard.writeText(campaign.id!);
      vscode.window.showInformationMessage(`[Flagship] Campaign: ${campaign.name}'s ID copied to your clipboard.`);
    }),

    vscode.commands.registerCommand(CAMPAIGN_LIST_OPEN_IN_BROWSER, async (campaign: CampaignItem) => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { account_environment_id } = (await context.globalState.get(GLOBAL_CURRENT_CONFIGURATION)) as Configuration;
      await vscode.env.openExternal(
        vscode.Uri.parse(
          `${DEFAULT_BASE_URI}/env/${account_environment_id}/report/${campaign.type}/${campaign.id}/details`,
        ),
      );
    }),

    vscode.commands.registerCommand(CAMPAIGN_LIST_DELETE, async (campaign: CampaignItem) => {
      await deleteCampaignBox(context, campaign, cli);
      await vscode.commands.executeCommand(PROJECT_LIST_LOAD);
    }),
  ];

  const variationGroupDisposables = [
    vscode.commands.registerCommand(VARIATION_GROUP_LIST_COPY, async (variationGroup: VariationGroupItem) => {
      vscode.env.clipboard.writeText(variationGroup.id!);
      vscode.window.showInformationMessage(
        `[Flagship] Variation group: ${variationGroup.name}'s ID copied to your clipboard.`,
      );
    }),

    vscode.commands.registerCommand(VARIATION_GROUP_LIST_DELETE, async (variationGroup: VariationGroupItem) => {
      await deleteVariationGroupBox(context, variationGroup, cli);
      await vscode.commands.executeCommand(PROJECT_LIST_LOAD);
    }),
  ];

  const variationDisposables = [
    vscode.commands.registerCommand(VARIATION_LIST_COPY, async (variation: VariationItem) => {
      vscode.env.clipboard.writeText(variation.id!);
      vscode.window.showInformationMessage(`[Flagship] Variation: ${variation.name}'s ID copied to your clipboard.`);
    }),

    vscode.commands.registerCommand(VARIATION_LIST_DELETE, async (variation: VariationItem) => {
      await deleteVariationBox(context, variation, cli);
      await vscode.commands.executeCommand(PROJECT_LIST_LOAD);
    }),
  ];

  const flagDisposables = [
    vscode.commands.registerCommand(FLAG_LIST_COPY, async (flag: FlagItem) => {
      vscode.env.clipboard.writeText(flag.key!);
      vscode.window.showInformationMessage(`[Flagship] Flag: ${flag.key} copied to your clipboard.`);
    }),

    vscode.commands.registerCommand(FLAG_LIST_EDIT, async (flag: FlagItem) => {
      const { scope } = context.globalState.get(GLOBAL_CURRENT_CONFIGURATION) as Configuration;
      if (scope?.includes('flag.update')) {
        await flagInputBox(flag, flagStore);
        await vscode.commands.executeCommand(FLAG_LIST_LOAD);
        return;
      }
      vscode.window.showWarningMessage(PERMISSION_DENIED);
      return;
    }),

    vscode.commands.registerCommand(FLAG_LIST_DELETE, async (flag: FlagItem) => {
      const { scope } = context.globalState.get(GLOBAL_CURRENT_CONFIGURATION) as Configuration;
      if (scope?.includes('flag.delete')) {
        await deleteFlagInputBox(flag, flagStore);
        await vscode.commands.executeCommand(FLAG_LIST_LOAD);
        return;
      }
      vscode.window.showWarningMessage(PERMISSION_DENIED);
      return;
    }),

    vscode.commands.registerCommand(FIND_IN_FILE, async (flagInFile: FlagAnalyzed) => {
      vscode.workspace
        .openTextDocument(flagInFile.file)
        .then((document) => vscode.window.showTextDocument(document))
        .then(() => {
          const activeEditor = vscode.window.activeTextEditor;
          const range = activeEditor!.document.lineAt(flagInFile.lineNumber - 1).range;
          activeEditor!.selection = new vscode.Selection(range.start, range.end);
          activeEditor!.revealRange(range);
        });
    }),

    vscode.commands.registerCommand(ADD_FLAG, async (flagInFile: FlagAnalyzed) => {
      const { scope } = context.globalState.get(GLOBAL_CURRENT_CONFIGURATION) as Configuration;
      if (scope?.includes('flag.create')) {
        const flag = new FlagItem();
        flag.key = flagInFile.flagKey;
        await flagInputBox(flag, flagStore);
        await vscode.commands.executeCommand(FLAG_LIST_LOAD);
        return;
      }
      vscode.window.showWarningMessage(PERMISSION_DENIED);
      return;
    }),

    vscode.commands.registerCommand(LIST_FLAG_IN_WORKSPACE, async () => {
      await vscode.commands.executeCommand(FLAG_IN_FILE_REFRESH, rootPath, true);
    }),
  ];

  const targetingKeyDisposables = [
    vscode.commands.registerCommand(TARGETING_KEY_LIST_EDIT, async (targetingKey: TargetingKeyItem) => {
      const { scope } = context.globalState.get(GLOBAL_CURRENT_CONFIGURATION) as Configuration;
      if (scope?.includes('targeting_key.update')) {
        await targetingKeyInputBox(targetingKey, targetingKeyStore);
        await vscode.commands.executeCommand(TARGETING_KEY_LIST_LOAD);
        return;
      }
      vscode.window.showWarningMessage(PERMISSION_DENIED);
      return;
    }),

    vscode.commands.registerCommand(TARGETING_KEY_LIST_DELETE, async (targetingKey: TargetingKeyItem) => {
      const { scope } = context.globalState.get(GLOBAL_CURRENT_CONFIGURATION) as Configuration;
      if (scope?.includes('targeting_key.delete')) {
        await deleteTargetingKeyInputBox(targetingKey, targetingKeyStore);
        await vscode.commands.executeCommand(TARGETING_KEY_LIST_LOAD);
        return;
      }
      vscode.window.showWarningMessage(PERMISSION_DENIED);
      return;
    }),
  ];

  const goalDispoables = [
    vscode.commands.registerCommand(GOAL_LIST_EDIT, async (goal: GoalItem) => {
      const { scope } = context.globalState.get(GLOBAL_CURRENT_CONFIGURATION) as Configuration;
      if (scope?.includes('goal.update')) {
        await goalInputBox(goal, goalStore);
        await vscode.commands.executeCommand(GOAL_LIST_LOAD);
        return;
      }
      vscode.window.showWarningMessage(PERMISSION_DENIED);
      return;
    }),

    vscode.commands.registerCommand(GOAL_LIST_DELETE, async (goal: GoalItem) => {
      const { scope } = context.globalState.get(GLOBAL_CURRENT_CONFIGURATION) as Configuration;
      if (scope?.includes('goal.delete')) {
        await deleteGoalInputBox(goal, goalStore);
        await vscode.commands.executeCommand(GOAL_LIST_LOAD);
        return;
      }
      vscode.window.showWarningMessage(PERMISSION_DENIED);
      return;
    }),
  ];

  vscode.languages.registerCompletionItemProvider(
    documentSelector,
    new FlagshipCompletionProvider(context, cli),
    "'",
    '"',
  );
  vscode.languages.registerHoverProvider(documentSelector, new FlagshipHoverProvider(context, cli, stateConfig));

  /* const codelensProvider = new CodelensProvider();

  languages.registerCodeLensProvider('*', codelensProvider); */

  context.subscriptions.push(
    flagFileProvider,
    getTokenInfo,
    createProject,
    createGoal,
    createTargetingKey,
    createFlag,
    quickAccessProvider,
    ...projectDisposables,
    ...campaignDisposables,
    ...variationGroupDisposables,
    ...variationDisposables,
    ...flagDisposables,
    ...targetingKeyDisposables,
    ...goalDispoables,
  );
}
