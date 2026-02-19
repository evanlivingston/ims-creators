import axios from "axios";
import ApiManager from "~ims-app-base/logic/managers/ApiManager";
import { HttpMethods, Service } from "~ims-app-base/logic/managers/ApiWorker";
import AuthManager from "~ims-app-base/logic/managers/AuthManager";


export default class DesktopAuthManager extends AuthManager{
    async login(email: string, password: string, target = 'site'){
        await this.appManager
                .get(ApiManager)
                .call(Service.AUTH, HttpMethods.POST, 'auth/login', {
                    email,
                    password,
                    target
                });
    }

    async confirmRequest(password: string, language: string, email: string){
        await this.appManager
                .get(ApiManager)
                .call(Service.AUTH, HttpMethods.POST, 'auth/confirm', {
                    password,
                    emailOrName: email,
                    language
                });
    }
}