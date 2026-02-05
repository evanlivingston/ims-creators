import DialogManager from '~ims-app-base/logic/managers/DialogManager';
import type { IAppManager } from '~ims-app-base/logic/managers/IAppManager';
import type { DialogVariable } from '../editor/DialogBlockController';
import EnterVariableDialog from '../dialogs/EnterVariableDialog.vue';
import { normalizeAssetPropPart } from '~ims-app-base/logic/types/Props';

export async function nodeVariableAdd(
  appManager: IAppManager,
  list: DialogVariable[],
  messages: {
    alreadyExist: string;
  },
  showAutoFill: boolean = false,
): Promise<DialogVariable | null> {
  const new_param = await appManager
    .get(DialogManager)
    .show(EnterVariableDialog, {
      showAutoFill,
      validate: (variable) => {
        const exists = list.some((v) => v.name === variable.name);
        if (exists) {
          throw new Error(messages.alreadyExist);
        }
      },
    });
  if (!new_param) return null;
  return new_param;
}

export async function nodeVariableChange(
  appManager: IAppManager,
  list: DialogVariable[],
  param: DialogVariable,
  messages: {
    alreadyExist: string;
  },
  showAutoFill: boolean = false,
): Promise<DialogVariable | null> {
  const new_param = await appManager
    .get(DialogManager)
    .show(EnterVariableDialog, {
      showAutoFill,
      initial: param,
      validate: (variable) => {
        const exists = list.some(
          (v) => v.name === variable.name && v !== param,
        );
        if (exists) {
          throw new Error(messages.alreadyExist);
        }
      },
    });
  if (!new_param) return null;
  return new_param;
}
export async function nodeVariableDuplicate(
  appManager: IAppManager,
  list: DialogVariable[],
  param: DialogVariable,
  messages: {
    alreadyExist: string;
  },
  showAutoFill: boolean = false,
): Promise<DialogVariable | null> {
  const check_param_exists = (name: string) => {
    return list.some((v) => v.name === name);
  };

  const guess_title = () => {
    const num_match = param.title.match(/^(.*)(\d+)(\))?$/);
    let guess_prefix: string;
    let guess_num: number;
    let guess_suffix: string;
    if (num_match) {
      guess_prefix = num_match[1];
      guess_num = parseInt(num_match[2]) + 1;
      guess_suffix = num_match[3] ?? '';
    } else {
      guess_prefix = param.title;
      guess_suffix = '';
      guess_num = 2;
    }
    const last_attempt = guess_num + 1000;
    let guess_title = guess_prefix + guess_num + guess_suffix;
    while (
      check_param_exists(normalizeAssetPropPart(guess_title)) &&
      guess_num <= last_attempt
    ) {
      guess_num++;
      guess_title = guess_prefix + guess_num + guess_suffix;
    }
    return guess_title;
  };

  const guessed_title = guess_title();

  const new_param = await appManager
    .get(DialogManager)
    .show(EnterVariableDialog, {
      showAutoFill,
      initial: {
        ...param,
        name: normalizeAssetPropPart(guessed_title),
        title: guessed_title,
      },
      validate: (variable) => {
        const exists = check_param_exists(variable.name);
        if (exists) {
          throw new Error(messages.alreadyExist);
        }
      },
    });
  if (!new_param) return null;
  return new_param;
}
