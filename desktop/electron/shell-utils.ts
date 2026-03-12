
import child_process, { type SpawnOptions } from 'node:child_process';
import { shell } from 'electron';

export async function launch(command: string, args: string[] = []){
    if (!args || args.length === 0){
        const error = await shell.openPath(command);
        if (error) throw new Error(error)
    }
    else {
        command = command.trim();
        return new Promise<void>((resolve, reject) => {
            try{
                const spawn_opts: SpawnOptions = {
                    detached: true,
                    stdio: "ignore"
                }
                if (/.(bat)$/.test(command)){
                    spawn_opts.shell = true;
                    if (/\s/.test(command)){
                        command = `"${command}"`
                    }
                }
                else if (process.platform === 'darwin' && /.app$/.test(command)){
                    let new_args = ['-a', command]
                    if (args.length > 0){
                        new_args.push(args[0]);
                        if (args.length > 1){
                            new_args = [...new_args, '--args', ...args.slice(1)];
                        }
                    }
                    args = new_args;
                    command = 'open'
                }
                const proc = child_process.spawn(command, args, spawn_opts);
                proc.on('spawn', () => {
                    resolve();
                })
                proc.on('error', (err) => {
                    reject(err);
                })
                proc.unref();
            }
            catch (err){
                reject(err);
            }
        });
    }
}

export function runCommand(execPath: string, args: string[] = []){
    let res_resolve!: (res: string) => void;
    let res_reject!: (err: Error) => void;
    const res = new Promise<string>((res, rej) => {
        res_resolve = res;
        res_reject = rej;
    })

    try {
        const child = child_process.spawn(execPath, args);
        let error = '';
        let output = '';

        child.stdout.on('data', function (data) {
            output += data;
        });

        child.stderr.on('data', function (data) {
            error += data;
        });

        child.on('close', function (code) {
            if (code && !error) {
                error = "Error code: " + code;
            }
            if (error) res_reject(new Error(error));
            else {
                res_resolve(output);
            }
        });

    }
    catch (err: any){
        res_reject(err);
    }

    return res;
}