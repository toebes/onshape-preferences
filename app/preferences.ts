/**
 * Copyright (c) 2023 John Toebes, Chris Peratrovich
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

import { exists } from 'onshape-typescript-fetch/runtime';
import { OnshapeAPI } from './onshapeapi';
import {
    BTGlobalTreeNodeInfo,
    GetAssociativeDataWvmEnum,
    BTGlobalTreeNodeInfoFromJSONTyped,
} from 'onshape-typescript-fetch';

const PREFERENCE_FILE_NAME = '⚙ Preferences ⚙';

export interface BTGlobalTreeProxyInfo extends BTGlobalTreeNodeInfo {
    // jsonType = 'proxy-library', 'proxy-folder', or 'proxy-element'
    wvm?: typeof GetAssociativeDataWvmEnum;
    wvmid?: string;
    elementId?: string;
}

export function BTGlobalTreeProxyInfoJSONTyped(
    json: any,
    ignoreDiscriminator: boolean
): BTGlobalTreeProxyInfo {
    if (json === undefined || json === null) {
        return json;
    }
    return {
        ...BTGlobalTreeNodeInfoFromJSONTyped(json, ignoreDiscriminator),
        wvm: !exists(json, 'wvm') ? undefined : json['wvm'],
        wvmid: !exists(json, 'wvmid') ? undefined : json['wvmid'],
        elementId: !exists(json, 'elementId') ? undefined : json['elementId'],
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
            this.getUserPreferencesDoc()
                .then((res) => {
                    this.getAppElement(appName, this.userPreferencesInfo)
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

    public initAppPreferences(appName: string, parentId: string): Promise<BTGlobalTreeProxyInfo> {
        // matches the app name.
        return new Promise((resolve, _reject) => {
            this.getAppPreferencesDoc(parentId)
                .then((res1) => {
                    console.log("whoa");
                    console.log(res1);
                    this.getAppElement(appName, res1)
                        .then((res2) => {
                            resolve(res1);
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
    public createCustom(
        name: string,
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            this.existsEntry(name, libInfo)
                .then((res) => {
                    if (!res) {
                        this.onshape.appElementApi
                            .updateAppElement({
                                bTAppElementUpdateParams: {
                                    jsonPatch: `[{ "op": "add", "path": "/${name}", "value": "" }]`,
                                },
                                did: libInfo.id,
                                eid: libInfo.elementId,
                                wvmid: libInfo.wvmid,
                                wvm: 'w',
                            })
                            .then((create_res) => {
                                resolve(true);
                            })
                            .catch((err) => {
                                console.log(err);
                                resolve(false);
                            });
                    } else {
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
    public setCustom(
        name: string,
        element: any,
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            this.existsEntry(name, libInfo)
                .then((res) => {
                    if (res) {
                        this.onshape.appElementApi
                            .updateAppElement({
                                bTAppElementUpdateParams: {
                                    jsonPatch: `[{ "op": "replace", "path": "/${name}", "value": "${element}" }]`,
                                },
                                did: libInfo.id,
                                eid: libInfo.elementId,
                                wvmid: libInfo.wvmid,
                                wvm: 'w',
                            })
                            .then((res) => {
                                resolve(true);
                            })
                            .catch((err) => {
                                resolve(false);
                            });
                    } else {
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
    public getCustom(
        name: string,
        default_val: any,
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<any> {
        return new Promise((resolve, _reject) => {
            this.onshape.appElementApi
                .getJson({
                    did: libInfo.id,
                    eid: libInfo.elementId,
                    wvmid: libInfo.wvmid,
                    wvm: 'w',
                })
                .then((res) => {
                    resolve(res.tree[name]);
                })
                .catch((err) => {
                    console.log(err);
                    resolve(default_val);
                });
        });
    }

    /**
     * Retrieve the last location saved with setLastKnownLocation
     * @returns Saved Array of BTGlobalTreeNodeInfo representing the full path to the location
     */
    public getLastKnownLocation(
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<Array<BTGlobalTreeNodeInfo>> {
        return this.getBTGArray('last_known_location', libInfo);
    }

    /**
     * Preserve the last location that we were at
     * @param location Location to save - Array of BTGlobalTreeNodeInfo representing the full path to the location
     */
    public setLastKnownLocation(
        location: Array<BTGlobalTreeNodeInfo>,
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<boolean> {
        return this.setBTGArray('last_known_location', location, libInfo);
    }

    /**
     * Set an arbitrary list of entries for the application to use as the home
     * @param items Array of items to store
     * @returns Success/failure indicator
     */
    public setHome(
        location: Array<BTGlobalTreeNodeInfo>,
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<boolean> {
        return this.setBTGArray('home', location, libInfo);
    }

    /**
     * returns what was sent to setHome
     * @returns Array of BTGlobalTreeNodeInfo items previously stored (or [] if none had ever been stored)
     */
    public getHome(
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<Array<BTGlobalTreeNodeInfo>> {
        return this.getBTGArray('home', libInfo);
    }

    /**
     * Add an item to the list of recently inserted items associated with the application.  Note that it only stores the last 50 sorted by date
     * @param item Item to add to the insert list
     */
    public addRecentlyInserted(
        item: BTGlobalTreeNodeInfo,
        limit: number = 50,
        name: string = 'recent',
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            resolve(false);
        });
    }
    /**
     *  Last 50 entries sent to addRecentlyInserted sorted by date.
     * @returns
     */
    public getAllRecentlyInserted(
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<Array<BTGlobalTreeNodeInfo>> {
        return this.getBTGArray('recent', libInfo);
    }

    /**
     * Add an item to the list of recently inserted items associated with the application.  Note that it only stores the last 50 sorted by date
     * @param item Item to add to the insert list.
     * 
     * TODO: Enforce 50 item buffer.
     */
    public setRecentlyInserted(location: Array<BTGlobalTreeNodeInfo>, libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo): Promise<boolean> {
        return this.setBTGArray("recently_inserted", location, libInfo);
    }

    /**
     *  Last entries sent to addRecentlyInserted sorted by date.
     * 
     * TODO: Enforce 50 item buffer, sorted by date.
     * @returns
     */
    public getRecentlyInserted(libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo): Promise<Array<BTGlobalTreeNodeInfo>> {
        return this.getBTGArray("recently_inserted", libInfo);
    }

    /**
     * @param location Location to save - Array of BTGlobalTreeNodeInfo representing the full path to the location
     */
    public setBTGArray(
        pref_name: string,
        location: Array<BTGlobalTreeNodeInfo>,
        libInfo: BTGlobalTreeProxyInfo
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            this.existsEntry(pref_name, libInfo)
                .then((res) => {
                    if (res) {
                        this.onshape.appElementApi
                            .updateAppElement({
                                bTAppElementUpdateParams: {
                                    jsonPatch: `[{ "op": "replace", "path": "/${pref_name}", "value": ${JSON.stringify(
                                        location
                                    )} }]`,
                                },
                                did: libInfo.id,
                                eid: libInfo.elementId,
                                wvmid: libInfo.wvmid,
                                wvm: 'w',
                            })
                            .then((res) => {
                                resolve(true);
                            })
                            .catch((err) => {
                                resolve(false);
                            });
                    } else {
                        // The entry did not exist, so create the entry then call this method again.
                        this.createCustom(pref_name)
                            .then((res) => {
                                this.setBTGArray(pref_name, location, libInfo)
                                    .then((res2) => resolve(res2))
                                    .catch((err) => {
                                        resolve(false);
                                    });
                            })
                            .catch((err) => {
                                resolve(false);
                            });
                    }
                })
                .catch((err) => {
                    resolve(false);
                });
        });
    }

    public getBTGArray(
        pref_name: string,
        libInfo: BTGlobalTreeProxyInfo
    ): Promise<Array<BTGlobalTreeNodeInfo>> {
        return new Promise((resolve, _reject) => {
            this.onshape.appElementApi
                .getJson({
                    did: libInfo.id,
                    eid: libInfo.elementId,
                    wvmid: libInfo.wvmid,
                    wvm: 'w',
                })
                .then((res) => {
                    let result: Array<BTGlobalTreeNodeInfo> = [];

                    for (let btg_json of res.tree[pref_name]) {
                        result.push(BTGlobalTreeProxyInfoJSONTyped(btg_json, false));
                    }

                    resolve(result);
                })
                .catch((err) => {
                    console.log(err);
                    resolve([]);
                });
        });
    }

    /**
     * Returns if there already exists a preference JSON entry for 'name' in the user
     * preferences app element data.
     *
     * @param name Name of element to retrieve
     */
    public existsEntry(name: string, libInfo: BTGlobalTreeProxyInfo): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            this.onshape.appElementApi
                .getJson({
                    did: libInfo.id,
                    eid: libInfo.elementId,
                    wvmid: libInfo.wvmid,
                    wvm: 'w',
                })
                .then((res) => {
                    resolve(res.tree.hasOwnProperty(name));
                })
                .catch((err) => {
                    resolve(false);
                });
        });
    }

    public getAppElement(
        appName: string,
        libInfo: BTGlobalTreeProxyInfo
    ): Promise<BTGlobalTreeProxyInfo> {
        return new Promise((resolve, reject) => {
            this.onshape.documentApi
                .getElementsInDocument({
                    did: libInfo.id,
                    wvm: 'w',
                    wvmid: libInfo.wvmid,
                })
                .then((res) => {
                    this.processAppElements(appName, res, libInfo).then((res) => {
                        resolve(res);
                    });
                })
                .catch((err) => {
                    console.log(err);
                });
        });
    }

    public processAppElements(
        appName: string,
        elements,
        libInfo: BTGlobalTreeProxyInfo
    ): Promise<BTGlobalTreeProxyInfo> {
        return new Promise((resolve, reject) => {
            let elem_found: Boolean = false;
            for (let element of elements) {
                if (
                    element.name == appName &&
                    element.dataType == 'onshape-app/preferences'
                ) {
                    libInfo.elementId = element.id;
                    resolve(libInfo);
                    elem_found = true;
                }
            }

            if (!elem_found) {
                this.onshape.appElementApi
                    .createElement({
                        bTAppElementParams: {
                            formatId: 'preferences',
                            name: appName,
                        },
                        did: libInfo.id,
                        wid: libInfo.wvmid,
                    })
                    .then((res) => {
                        libInfo.elementId = res.elementId;
                        console.log('Created new app element since it did not exist.');
                        resolve(libInfo);
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
    public getUserPreferencesDoc(): Promise<BTGlobalTreeProxyInfo> {
        return new Promise((resolve, reject) => {
            this.onshape.documentApi
                .search({
                    bTDocumentSearchParams: {
                        ownerId: this.onshape.userId,
                        limit: 100,
                        when: 'LATEST',
                        sortColumn: '',
                        sortOrder: '',
                        rawQuery: 'type:document name:⚙ Preferences ⚙',
                        documentFilter: 0,
                    },
                })
                .then((res) => {
                    this.getDocFromQuery(res, "").then((res2) => {
                        resolve(res2);
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    /**
     * WORK IN PROGRESS: Get the preferences document for a specific application.
     */
    public getAppPreferencesDoc(parentId: string): Promise<BTGlobalTreeProxyInfo> {
        return new Promise((resolve, reject) => {
            this.onshape.documentApi
                .search({
                    bTDocumentSearchParams: {
                        // parentId: parentId,
                        limit: 100,
                        when: 'LATEST',
                        sortColumn: 'name',
                        sortOrder: '',
                        // documentFilter: 0,
                    },
                })
                .then((res) => {
                    console.log("Search Results:");
                    console.log(res);
                    this.getDocFromQuery(res, parentId).then((res2) => {
                        resolve(res2);
                    });
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
    public getDocFromQuery(res, parentId: string): Promise<BTGlobalTreeProxyInfo> {
        return new Promise((resolve, reject) => {
            if (res.items.length > 0) {
                this.userPreferencesInfo = BTGlobalTreeProxyInfoJSONTyped(
                    { id: res.items[0].id },
                    true
                );

                this.onshape.documentApi
                    .getDocumentWorkspaces({ did: res.items[0].id })
                    .then((res) => {
                        console.log(res);
                        this.userPreferencesInfo.wvmid = res[0].id;
                        this.userPreferencesInfo.wvm = GetAssociativeDataWvmEnum['w'];

                        resolve(this.userPreferencesInfo);
                    })
                    .catch((err) => {
                        reject(err);
                    });
            } else {
                // The user preferences document did not exists, so make a new one and return the
                // BTG info for the newly created document.
                this.onshape.documentApi
                    .createDocument({
                        bTDocumentParams: {
                            ownerId: this.onshape.userId,
                            name: '⚙ Preferences ⚙',
                            description: 'Document used to store application preferences',
                            parentId: parentId,
                        },
                    })
                    .then((res) => {
                        console.log(
                            'Created new preferences document since it did not exist.'
                        );

                        this.userPreferencesInfo = BTGlobalTreeProxyInfoJSONTyped(
                            {
                                id: res.id,
                                wvmid: res.id,
                                wvm: GetAssociativeDataWvmEnum['w'],
                            },
                            true
                        );

                        resolve(this.userPreferencesInfo);
                    })
                    .catch((err) => {
                        reject(err);
                    });
            }
        });
    }

    /*********************************************************************************
     *                         PROXY LIBRARY/FOLDER ROUTINES                         *
     *********************************************************************************/
    /**
     * Creates a proxy Library object as a real Onshape document in a given location.
     * Note that the parent must be a real Onshape folder location
     * @param parent Location in Onshape hierarchy to create the new folder object
     * @param name Name to associate with the library
     */
    public createProxyLibrary(
        parent: BTGlobalTreeNodeInfo,
        name: string
    ): Promise<BTGlobalTreeNodeInfo> {
        return new Promise((resolve, _reject) => {
            const result: BTGlobalTreeNodeInfo = {
                jsonType: 'proxy-library',
                name: name,
            };
            resolve(undefined);
        });
    }
    /**
     * Creates a proxy folder object inside a proxy library
     * Note that the parent must be a proxy-library type.  Entries return
     * @param parent Proxy Library object to contain the folder
     * @param name Name to associate with the folder
     * @returns BTGlobalTreeNodeInfo associated with the newly created entry
     */
    public createProxyFolder(
        parent: BTGlobalTreeNodeInfo,
        name: string
    ): Promise<BTGlobalTreeNodeInfo> {
        return new Promise((resolve, _reject) => {
            const result: BTGlobalTreeNodeInfo = {
                jsonType: 'proxy-folder',
                name: name,
            };
            resolve(undefined);
        });
    }
    // TODO: Do we need a setProxyMetaData/getProxyMetaData routine to store extra
    //       information with the proxy library objects (such as owner, contact info, website...)
    /**
     * Sets the metadata for a proxy item
     * @param entry Proxy item (proxy-folder or proxy-library) to set metadata for
     * @param metadata Arbitrary metadata to set
     */
    public setProxyMetadata(
        entry: BTGlobalTreeNodeInfo,
        metadata: any
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            resolve(false);
        });
    }
    /**
     * Retrieves the metadata for a proxy item
     * @param entry Proxy item (proxy-folder or proxy-library) to set metadata for
     * @returns Arbitrary metadata set with setProxyMetadata
     */
    getProxyMetadata(entry: BTGlobalTreeNodeInfo): Promise<any> {
        return new Promise((resolve, _reject) => {
            resolve(undefined);
        });
    }
    /**
     * Set the content for a proxy library object
     * @param library Previously created proxy library object (created with createProxyLibrary)
     * @param entries Sorted array of BTGlobalTreeNodeInfo objects representing the contents of the library
     */
    public setProxyLibrary(
        library: BTGlobalTreeNodeInfo,
        entries: Array<BTGlobalTreeNodeInfo>
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            resolve(false);
        });
    }
    /**
     * Gets the contents of a proxy library object
     * @param library Previously created proxy library object (created with createProxyLibrary)
     * @returns Sorted Array of BTGlobalTreeNodeInfo objects stored in the proxy library
     */
    public getProxyLibrary(
        library: BTGlobalTreeNodeInfo
    ): Promise<Array<BTGlobalTreeNodeInfo>> {
        return new Promise((resolve, _reject) => {
            resolve([]);
        });
    }
    /**
     * Set the content for a proxy folder object
     * @param folder Previously created proxy folder object (created with createProxyFolder)
     * @param entries Sorted Array of BTGlobalTreeNodeInfo objects to store in the proxy folder
     * @returns Success/Failure
     */
    public setProxyFolder(
        folder: BTGlobalTreeNodeInfo,
        entries: Array<BTGlobalTreeNodeInfo>
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            resolve(false);
        });
    }
    /**
     * Get the content for a proxy folder object
     * @param folder Previously created proxy folder object (created with createProxyFolder)
     * @returns Sorted Array of BTGlobalTreeNodeInfo objects stored in the proxy folder
     */
    public getProxyFolder(
        folder: BTGlobalTreeNodeInfo
    ): Promise<Array<BTGlobalTreeNodeInfo>> {
        return new Promise((resolve, _reject) => {
            resolve([]);
        });
    }
}
