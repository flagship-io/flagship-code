/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';

import { CredentialStore } from './model';
import { CONFIGURATION_LIST, CURRENT_CONFIGURATION } from './const';

export class Configuration {
  private readonly context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async updateWorkspaceState(key: string, value: string | CredentialStore[] | CredentialStore): Promise<void> {
    await this.context.workspaceState.update(key, value);
    (<any>this)[key] = value as string;
    return;
  }

  async getWorkspaceState(key: string): Promise<CredentialStore[] | CredentialStore | unknown> {
    const currValue = await this.context.workspaceState.get(key);
    if (typeof currValue !== 'undefined') {
      return currValue;
    }
  }

  async updateGlobalState(key: string, value: string | CredentialStore[] | CredentialStore): Promise<void> {
    await this.context.globalState.update(key, value);
    (<any>this)[key] = value as string;
    return;
  }

  async getGlobalState(key: string): Promise<CredentialStore[] | CredentialStore | unknown> {
    const currValue = await this.context.globalState.get(key);
    if (typeof currValue !== 'undefined') {
      return currValue;
    }
  }

  async clearWorkspaceConfig(): Promise<void> {
    await this.context.workspaceState.update(CONFIGURATION_LIST, undefined);
    await this.context.workspaceState.update(CURRENT_CONFIGURATION, undefined);
  }

  async clearGlobalConfig(): Promise<void> {
    await this.context.globalState.update(CONFIGURATION_LIST, undefined);
    await this.context.globalState.update(CURRENT_CONFIGURATION, undefined);
  }

  async isWorkspaceConfigured(): Promise<boolean> {
    return (
      !!(await this.context.workspaceState.get(CURRENT_CONFIGURATION)) &&
      !!(await this.context.workspaceState.get('FSConfigured'))
    );
  }

  async hasWorkspaceConfigured(): Promise<boolean> {
    return !!(await this.context.workspaceState.get(CONFIGURATION_LIST));
  }

  async isGlobalConfigured(): Promise<boolean> {
    return (
      !!(await this.context.globalState.get(CURRENT_CONFIGURATION)) &&
      !!(await this.context.globalState.get('FSConfigured'))
    );
  }
}
