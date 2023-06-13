/**
 * Copyright (c) 2023 John Toebes
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS “AS IS” AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
 * OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 * EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

import { exists, mapValues } from 'onshape-typescript-fetch/runtime';
import { OnshapeAPI } from './onshapeapi';
import { BTGlobalTreeNodeInfo, GetAssociativeDataWvmEnum, BTGlobalTreeNodeInfoFromJSONTyped } from 'onshape-typescript-fetch';

/**
 * BaseApp contains all the support routines that your application will need.
 * You should not need to make any changes in this file (except for potential bug fixes)
 * because everything you will want to override will be in app.ts (or other files you extend it with)
 */

const PREFERENCE_FILE_NAME = "⚙ Preferences ⚙";

export interface BTGlobalTreeProxyInfo extends BTGlobalTreeNodeInfo {
    // jsonType = 'proxy-library', 'proxy-folder', or 'proxy-element'
    wvm?: typeof GetAssociativeDataWvmEnum;
    wvmid?: string;
    elementId?: string;
}

export function BTGlobalTreeProxyInfoJSONTyped(json: any, ignoreDiscriminator: boolean): BTGlobalTreeProxyInfo {
    console.log("MAKING JSON");
    console.log(json);
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        ...BTGlobalTreeNodeInfoFromJSONTyped(json, ignoreDiscriminator),
        'wvm': !exists(json, 'wvm') ? undefined : json['wvm'],
        'wvmid': !exists(json, 'wvmid') ? undefined : json['wvmid'],
        'elementId': !exists(json, 'elementId') ? undefined : json['elementId'],
    };
}

export class Preferences {
    /**
     * main.ts is the main entry point for running all the typescript client code
     */
    public onshape: OnshapeAPI;
    public userPreferencesInfo: BTGlobalTreeProxyInfo = undefined;

    /**
     * Initialize the app because we have gotten permission from Onshape to access content
     */
    public constructor(onshape: OnshapeAPI) {
        this.onshape = onshape;
    }

    /**
     * Initialize the preferences API for an application named 'appName'
     */
    public initUserPreferences(appName: string): Promise<BTGlobalTreeProxyInfo> {
        // matches the app name.
        return new Promise((resolve, _reject) => {
            this.getPreferencesDoc()
                .then((res) => {
                    this.getAppElement(appName)
                        .then((res) => {
                            resolve(this.userPreferencesInfo);
                        })
                        .catch((err) => {
                            console.log(err);
                            resolve(undefined);
                        });
                })
                .catch((err) => {
                    console.log(err);
                    resolve(undefined);
                });
        });
    }


    /**
     * Creates an empty JSON element stored in the user preferences with the given name.  If it already exists, it returns false (does not throw an exception).
     * @param name String for entry to be created, generally associated with the application name
     */
    public createCustom(name: string): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            this.existsCustom(name)
                .then((res) => {
                    if (!res) {
                        this.onshape.appElementApi.updateAppElement({
                            bTAppElementUpdateParams: { jsonPatch: `[{ "op": "add", "path": "/${name}", "value": "" }]`, },
                            did: this.userPreferencesInfo.id,
                            eid: this.userPreferencesInfo.elementId,
                            wvmid: this.userPreferencesInfo.wvmid,
                            wvm: "w"
                        })
                            .then((res) => {
                                resolve(true);
                            })
                            .catch((err) => {
                                resolve(false);
                            });
                    }
                    else {
                        // The entry already existed!
                        resolve(false);
                    }
                })
                .catch((err) => {
                    resolve(false);
                });
        });
    }

    /**
     * Stores the element as JSON in the preferences associated with the name.
     * If the element doesn’t exist in the preferences, it returns false (does not thrown an exception)
     * @param name Name of element to set
     * @param element Value to be stored into element
     */
    public setCustom(name: string, element: any): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            this.existsCustom(name)
                .then((res) => {

                    console.log(res)
                    if (res) {
                        this.onshape.appElementApi.updateAppElement({
                            bTAppElementUpdateParams: { jsonPatch: `[{ "op": "replace", "path": "/${name}", "value": "${element}" }]`, },
                            did: this.userPreferencesInfo.id,
                            eid: this.userPreferencesInfo.elementId,
                            wvmid: this.userPreferencesInfo.wvmid,
                            wvm: "w"
                        })
                            .then((res) => {
                                console.log(res)
                                resolve(true);
                            })
                            .catch((err) => {
                                resolve(false);
                            });
                    }
                    else {
                        // The entry did not exist, it must be created first!
                        resolve(false);
                    }
                })
                .catch((err) => {
                    resolve(false);
                });
        });
    }

    /**
     * Returns the element which was stored as a JSON object as an object.
     * If the element doesn’t exist the default value is returned.
     * @param name Name of element to retrieve
     * @param default_val Default value to return if the element wasn't already set
     */
    public getCustom(name: string, default_val: any): Promise<any> {
        return new Promise((resolve, _reject) => {
            this.onshape.appElementApi.getJson(
                {
                    did: this.userPreferencesInfo.id,
                    eid: this.userPreferencesInfo.elementId,
                    wvmid: this.userPreferencesInfo.wvmid,
                    wvm: "w",
                })
                .then((res) => {
                    console.log(res);
                    resolve(res.tree[name]);
                })
                .catch((err) => {
                    console.log(err);
                    resolve(default_val);
                })
        });
    }

    /**
     * Returns if there already exists a custom preferences JSON entry for 'name' in the user
     * preferences app element data.
     * 
     * @param name Name of element to retrieve
     */
    public existsCustom(name: string): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            this.onshape.appElementApi.getJson(
                {
                    did: this.userPreferencesInfo.id,
                    eid: this.userPreferencesInfo.elementId,
                    wvmid: this.userPreferencesInfo.wvmid,
                    wvm: "w",
                })
                .then((res) => {
                    resolve(res.hasOwnProperty(name));
                })
                .catch((err) => {
                    resolve(false);

                });
        });
    }

    public getAppElement(appName: string): Promise<BTGlobalTreeProxyInfo> {
        return new Promise((resolve, reject) => {
            this.onshape.documentApi.getElementsInDocument(
                {
                    did: this.userPreferencesInfo.id,
                    wvm: "w",
                    wvmid: this.userPreferencesInfo.wvmid
                })
                .then((res) => {
                    resolve(this.processAppElements(appName, res));
                })
                .catch((err) => {
                    console.log(err);
                });
        });
    }

    public processAppElements(appName: string, elements): Promise<BTGlobalTreeProxyInfo> {
        return new Promise((resolve, reject) => {
            let elem_found: Boolean = false;
            for (let element of elements) {
                if (element.name == appName && element.dataType == "onshape-app/preferences") {
                    this.userPreferencesInfo.elementId = element.id;
                    resolve(this.userPreferencesInfo);
                    elem_found = true;
                }
            }

            if (!elem_found) {
                this.onshape.appElementApi.createElement({
                    bTAppElementParams: {
                        formatId: "preferences", name: appName
                    },
                    did: this.userPreferencesInfo.id,
                    wid: this.userPreferencesInfo.wvmid,
                })
                    .then((res) => {
                        this.userPreferencesInfo.elementId = res.elementId;
                        console.log("Created new app element since it did not exist.");
                        resolve(this.userPreferencesInfo);
                    })
                    .catch((err) => {
                        reject(err);
                    });
            }
        });
    }

    /**
     * Retrieve the user preferences document which should be in the top level folder of Onshape
     * for this user.
     */
    public getPreferencesDoc(): Promise<BTGlobalTreeProxyInfo> {
        return new Promise((resolve, reject) => {
            this.onshape.documentApi.search(
                {
                    'bTDocumentSearchParams': {
                        "ownerId": this.onshape.userId,
                        "limit": 100,
                        "when": "LATEST",
                        "sortColumn": "",
                        "sortOrder": "",
                        "rawQuery": "type:document name:⚙ Preferences ⚙",
                        "documentFilter": 0
                    }
                })
                .then((res) => {
                    resolve(this.getDocFromQuery(res));
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    /**
     * Retrieve the user preferences document which should be in the top level folder of Onshape
     * for this user. If the document does not exists, create the document for the user.
     */
    public getDocFromQuery(res): Promise<BTGlobalTreeProxyInfo> {
        return new Promise((resolve, reject) => {
            if (res.items.length > 0) {
                this.userPreferencesInfo = BTGlobalTreeProxyInfoJSONTyped(
                    { "id": res.items[0].id }, true);

                this.onshape.documentApi.getDocumentWorkspaces({ 'did': res.items[0].id })
                    .then((res) => {

                        this.userPreferencesInfo.wvmid = res[0].id;
                        this.userPreferencesInfo.wvm = GetAssociativeDataWvmEnum["w"];

                        resolve(this.userPreferencesInfo);
                    })
                    .catch((err) => {
                        reject(err);
                    });

            }
            else {
                // The user preferences document did not exists, so make a new one and return the 
                // BTG info for the newly created document.
                this.onshape.documentApi
                    .createDocument(
                        {
                            'bTDocumentParams': {
                                "ownerId": this.onshape.userId,
                                "name": "⚙ Preferences ⚙",
                                "description": "Document used to store application preferences"
                            }
                        })
                    .then((res) => {
                        console.log("Created new preferences document since it did not exist.");

                        this.userPreferencesInfo = BTGlobalTreeProxyInfoJSONTyped(
                            {
                                "id": res.id,
                                "wvmid": res.id,
                                "wvm": GetAssociativeDataWvmEnum["w"]
                            }, true);

                        resolve(this.userPreferencesInfo);
                    })
                    .catch((err) => {
                        reject(err);
                    });
            }
        });
    }
}
