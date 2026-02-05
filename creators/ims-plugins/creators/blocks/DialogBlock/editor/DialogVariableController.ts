import type { DialogVariable } from './DialogBlockController';

export interface IDialogVariableController {
  getVariables(): DialogVariable[];
  addVariable(variable: DialogVariable): void;
  changeVariable(variable_name: string, variable: DialogVariable): void;
  deleteVariable(variable_name: string): void;
  canDeleteVariable(variable_name: string): boolean;
  reorderVariables(variables: DialogVariable[]): void;
}
