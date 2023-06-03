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

import { ExchangeToken, IExchangeToken } from './oauth';
import * as runtime from 'onshape-typescript-fetch/runtime';
import { URLApi } from './urlapi';
import { BaseApp } from './baseapp';
import {
    BTGlobalTreeMagicNodeInfo,
    BTGlobalTreeNodesInfo,
    BTGlobalTreeNodesInfoFromJSON,
} from 'onshape-typescript-fetch/models';

/**
 * BaseApp contains all the support routines that your application will need.
 * You should not need to make any changes in this file (except for potential bug fixes)
 * because everything you will want to override will be in app.ts (or other files you extend it with)
 */

const PREFERENCE_FILE_NAME = "⚙ Preferences ⚙";

export class Preferences {
    /**
     * main.ts is the main entry point for running all the typescript client code
     */
    public app: BaseApp;

    /**
     * Initialize the app because we have gotten permission from Onshape to access content
     * @param access_token Access token returned by Onshape
     * @param refresh_token Refresh token needed if the Access Token has to be refreshed
     * @param expires Time when the token expires and needs to be updated
     */
    public init_api(app: BaseApp, appName: String) {
        this.app = app;

        // Check if the expected file name is there.
        console.log("Loading Docs");

        // Check if the there is also a preferences document with an application element that
        // matches the app name.
        this.getPreferencesDoc()
            .then((res) => {
                this.getAppElement(appName, res)
                    .then((res) => {
                        console.log(res);
                    })
                    .catch((err) => {
                        console.log(err);
                    });

                console.log(res);
            })
            .catch((err) => {
                console.log(err);
            });
    }

    /**
     * The main initialization routine.  This is invoked once the web page is initially loaded
     */
    public init(): void {
        return;
    }

    public getAppElement(appName, docInfo): Promise<Record<string, string>> {
        return new Promise((resolve, reject) => {
            this.app.documentApi.getElementsInDocument({ did: docInfo['did'], wvm: "w", wvmid: docInfo['wid'] })
                .then((res) => {
                    console.log(res);
                    resolve(this.processAppElements(appName, docInfo, res));
                })
                .catch((err) => {
                    console.log(err);
                });
        });
    }

    public processAppElements(appName, docInfo, elements): Promise<Record<string, string>> {
        return new Promise((resolve, reject) => {
            let elem_found: Boolean = false;
            for (let element of elements) {
                if (element.name == appName && element.dataType == "onshape-app/preferences") {
                    docInfo['eid'] = element.id;
                    resolve(docInfo);
                    elem_found = true;
                }
            }

            if (!elem_found) {
                this.app.appElementApi.createElement({
                    bTAppElementParams: { formatId: "preferences", name: appName}, did: docInfo['did'], wid: docInfo['wid']
                })
                    .then((res) => {
                        docInfo["eid"] = res.elementId;
                        console.log("Created new app element since it did not exist.");
                        resolve(docInfo);
                    })
                    .catch((err) => {
                        reject(err);
                    });
            }
        });
    }

    public getPreferencesDoc(): Promise<Record<string, string>> {
        return new Promise((resolve, reject) => {
            this.app.documentApi.search(
                {
                    'bTDocumentSearchParams': {
                        "ownerId": this.app.userId,
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

    public getDocFromQuery(res): Promise<Record<string, string>> {
        return new Promise((resolve, reject) => {
            if (res.items.length > 0) {
                console.log("Found an existing preferences document.");
                console.log(res.items[0]);
                resolve({ "did": res.items[0].id, "wid": res.items[0].defaultWorkspace.id });
            }
            else {
                this.app.documentApi
                    .createDocument(
                        {
                            'bTDocumentParams': {
                                "ownerId": this.app.userId,
                                "name": "⚙ Preferences ⚙",
                                "description": "Document used to store application preferences"
                            }
                        })
                    .then((res) => {
                        console.log("Created new preferences document since it did not exist.");
                        resolve({ "did": res.id, "wid": res.id });
                    })
                    .catch((err) => {
                        reject(err);
                    });
            }
        });
    }
}
