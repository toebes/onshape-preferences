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
import {
    GlobalTreeNodesApi,
    BTThumbnailInfo,
    VariablesApi,
} from 'onshape-typescript-fetch';

/**
 * BaseApp contains all the support routines that your application will need.
 * You should not need to make any changes in this file (except for potential bug fixes)
 * because everything you will want to override will be in app.ts (or other files you extend it with)
 */

export class BaseApp {
    /**
     * main.ts is the main entry point for running all the typescript client code
     */
    public documentId = '';
    public workspaceId = '';
    public elementId = '';
    public server = 'https://cad.onshape.com';
    public userId = '';
    public clientId = '';
    public companyId = '';
    public code = '';
    public myserver = ''; // Fill in with your server
    public access_token: string;
    public refresh_token: string;
    public expires_token: Date;

    public globaltreenodesApi: GlobalTreeNodesApi;
    public urlAPI: URLApi;
    public variablesApi: VariablesApi;
    public configuration: runtime.Configuration;

    /**
     * Handle any post messages sent to us
     * @param e Event message
     */
    public handlePostMessage(e: MessageEvent<any>): any {
        console.log('Post message received in application extension.');
        console.log('e.origin = ' + e.origin);

        // Verify the origin matches the server iframe src query parameter
        if (this.server === e.origin) {
            console.log(
                "Message safe and can be handled as it is from origin '" +
                    e.origin +
                    "', which matches server query parameter '" +
                    this.server +
                    "'."
            );
            if (e.data && e.data.messageName) {
                console.log("Message name = '" + e.data.messageName + "'");
            } else {
                console.log('Message name not found. Ignoring message.');
            }
        } else {
            console.log('Message NOT safe and should be ignored.');
        }
    }
    /**
     * Get a thumbnail for an Onshape hosted image
     * This addresses the issue where we want to do <img src="https://cad.onshape.com/...">
     * But it can't be displayed by the browser because we don't have the Bearer token on the request
     *
     * @param thumbnail thumbnailItem information to be retrieved
     * @param height Height of the rendered image (default = 60)
     * @param width Width of the rendered image (default = 60)
     * @returns base 64 image data string
     */
    public getThumbnail(
        thumbnail: BTThumbnailInfo,
        height: number = 60,
        width: number = 60
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            // TODO: Walk through the list of sizes to see if any are ideal for what we want
            // For now we use the default URL and tell them to resize it on the fly for us
            let tryurl = thumbnail.href;
            if (thumbnail.sizes !== undefined && thumbnail.sizes.length > 0) {
                tryurl = thumbnail.sizes[0].href;
            }
            let xhr = new XMLHttpRequest();

            if (tryurl === null) {
                resolve(
                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAy0lEQVRIie2VXQ6CMBCEP7yDXkEjeA/x/icQgrQcAh9czKZ0qQgPRp1kk4ZZZvYnFPhjJi5ABfRvRgWUUwZLxIe4asEsMOhndmzhqbtZSdDExxh0EhacRBIt46V5oJDwEd4BuYQjscc90ATiJ8UfgFvEXPNNqotCKtEvF8HZS87wLAeOijeRTwhahsNoWmVi4pWRhLweqe4qCp1kLVUv3UX4VgtaX7IXbmsU0knuzuCz0SEwWIovvirqFTSrKbLkcZ8v+RecVyjyl3AHdAl3ObMLisAAAAAASUVORK5CYII='
                );
                return;
            }
            let url = this.myserver + this.fixOnshapeURI(tryurl);
            if (url.indexOf('?') < 0) {
                url += '?';
            } else {
                url += '&';
            }
            url += `outputHeight=${height}&outputWidth=${width}&pixelSize=0`;

            xhr.open('GET', url, true);
            xhr.setRequestHeader(
                'Authorization',
                'Bearer ' + this.access_token
            );
            xhr.setRequestHeader('X-Server', this.server);
            // We want to get a blob so that it isn't UTF-8 encoded along the way
            xhr.responseType = 'blob';

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        // Parse out the downloaded image into a data URL (this automatically base64 encodes it)
                        var reader = new FileReader();
                        reader.readAsDataURL(xhr.response);
                        reader.onloadend = function () {
                            resolve(reader.result.toString());
                        };
                    } else {
                        // Something wennt wrong so give them a blank image
                        resolve(
                            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAy0lEQVRIie2VXQ6CMBCEP7yDXkEjeA/x/icQgrQcAh9czKZ0qQgPRp1kk4ZZZvYnFPhjJi5ABfRvRgWUUwZLxIe4asEsMOhndmzhqbtZSdDExxh0EhacRBIt46V5oJDwEd4BuYQjscc90ATiJ8UfgFvEXPNNqotCKtEvF8HZS87wLAeOijeRTwhahsNoWmVi4pWRhLweqe4qCp1kLVUv3UX4VgtaX7IXbmsU0knuzuCz0SEwWIovvirqFTSrKbLkcZ8v+RecVyjyl3AHdAl3ObMLisAAAAAASUVORK5CYII='
                        );
                    }
                }
            };
            xhr.send();
        });
    }
    /**
     * Request refreshing the token because it has expired
     */
    public refreshtoken(): void {
        // set clientId
        let xhr = new XMLHttpRequest();
        let url = this.myserver + '/refresh.php?code=' + this.clientId;
        xhr.open('GET', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(
                    xhr.responseText,
                    'text/xml'
                );

                console.log('*** REFRESHED TOKEN');
                console.log(xmlDoc);
            }
        };
        xhr.send();
    }
    /**
     *
     * @param uri URI returned from Onshape
     * @returns Cleaned up URI that can be passed to
     */
    public fixOnshapeURI(uri: string): string {
        if (uri.substring(0, this.server.length) === this.server) {
            uri = uri.substring(this.server.length);
        }
        return uri;
    }
    /**
     * Replace the main app elements.  Note if there is no app div, the elements are appended to the main body so that they aren't lost
     * @param elem Element to replace
     */
    public setAppElements(elem: HTMLElement): void {
        let appelement = document.getElementById('app');
        if (appelement !== null) {
            appelement.innerHTML = '';
        } else {
            appelement = document.body;
        }
        appelement.append(elem);
    }
    /**
     * Create the initial page showing that we are initializing
     */
    public showInitializing() {
        var h2 = document.createElement('h2');
        h2.innerHTML = 'Initializing';
        this.setAppElements(h2);
    }

    /**
     * Call a generic URL returned from an Onshape response and transform it to the correct type
     * @param url Url to call
     * @param infoFromJSON Transformation function pointer that takes a JSON result and converts it to the right type
     * @param method  'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD' Default='GET'
     * @param initOverrides Any overrides specific to this one request
     * @returns A promise that will return the result of the call
     */
    public async OnshapeRequest(
        url: string,
        infoFromJSON: (json: any) => any,
        method: runtime.HTTPMethod = 'GET',
        initOverrides?: RequestInit | runtime.InitOverrideFunction
    ): Promise<any> {
        console.log(`***Onshape Request ${url}`);
        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.accessToken) {
            // oauth required
            headerParameters['Authorization'] =
                await this.configuration.accessToken('OAuth2', ['OAuth2Read']);
        }

        if (
            this.configuration &&
            (this.configuration.username !== undefined ||
                this.configuration.password !== undefined)
        ) {
            headerParameters['Authorization'] =
                'Basic ' +
                btoa(
                    this.configuration.username +
                        ':' +
                        this.configuration.password
                );
        }

        const response = await this.urlAPI.request({
            path: this.fixOnshapeURI(url),
            method: method,
            headers: headerParameters,
            query: {},
        });

        const result = new runtime.JSONApiResponse(response, (jsonValue) =>
            infoFromJSON(jsonValue)
        );
        return await result.value();
    }

    /**
     * Initialize the app because we have gotten permission from Onshape to access content
     * @param access_token Access token returned by Onshape
     * @param refresh_token Refresh token needed if the Access Token has to be refreshed
     * @param expires Time when the token expires and needs to be updated
     */
    public initApp(access_token: string, refresh_token: string, expires: Date) {
        this.access_token = access_token;
        this.refresh_token = refresh_token;
        this.expires_token = expires;

        this.configuration = new runtime.Configuration({
            basePath: this.myserver, // override base path
            // middleware?: Middleware[]; // middleware to apply before/after fetch requests
            accessToken: (
                name?: string,
                scopes?: string[]
            ): Promise<string> => {
                return new Promise<string>((resolve, reject) => {
                    // TODO: Check lifetime of bearer token and if needed request a new one
                    resolve('Bearer ' + this.access_token);
                });
            },
            headers: { 'X-Server': this.server },
            //header params we want to use on every request
        });

        this.urlAPI = new URLApi(this.configuration);
        this.variablesApi = new VariablesApi(this.configuration);
        this.globaltreenodesApi = new GlobalTreeNodesApi(this.configuration);

        this.ListenForAppClicks();
        this.AddPostMessageListener();
        this.NotifyOnshapeAppInit();
        this.startApp();
    }
    /**
     *  Notify Onshape that we have initialized and are ready to do work
     * See: https://onshape-public.github.io/docs/clientmessaging/
     */
    public NotifyOnshapeAppInit() {
        let message = {
            documentId: this.documentId,
            workspaceId: this.workspaceId,
            elementId: this.elementId,
            messageName: 'applicationInit',
        };
        console.log('Posting message: %o', message);
        window.parent.postMessage(message, '*');
    }
    /**
     * Add a listener for any post messages from Onshape.  When they come in,
     * they will be redirected to the handlePostmessage handler.
     */
    public AddPostMessageListener() {
        window.addEventListener(
            'message',
            (event: Event) => {
                this.handlePostMessage(event as MessageEvent<any>);
                // event
            },
            false
        );
        console.log('Event Listener added to %o', window);
    }
    /**
     * Listen for clicks in our application and post a message to the Onshape client
     */
    public ListenForAppClicks() {
        const topelement = document.getElementById('top');
        if (topelement !== null) {
            topelement.addEventListener(
                'click',
                () => {
                    console.log('clicked!');
                    let message = {
                        documentId: this.documentId,
                        workspaceId: this.workspaceId,
                        elementId: this.elementId,
                        messageName: 'closeFlyoutsAndMenus',
                    };
                    console.log('Posting message: %o', message);
                    window.parent.postMessage(message, '*');
                },
                true
            );
        }
    }
    /**
     * The main entry point for an app
     */
    public startApp(): void {}
    /**
     * This is called when there is a problem initializing/getting the authorization token
     * @param reason Initialization failure reason
     */
    public failApp(reason: string): void {
        var div = document.createElement('div');
        var h2 = document.createElement('h2');
        h2.innerHTML = 'Unable to Start Application';
        var p = document.createElement('p');
        p.innerText = reason;
        div.append(h2);
        div.appendChild(p);
        this.setAppElements(div);
    }
    /**
     * The main initialization routine.  This is invoked once the web page is initially loaded
     */
    public init(): void {
        this.showInitializing();

        // Parse query parameters
        let queryParameters = decodeURIComponent(
            window.location.search.substring(1)
        );
        let qp = document.getElementById('qp');
        if (qp !== null) {
            qp.innerHTML = queryParameters;
        }
        let queryParametersArray = queryParameters.split('&');
        for (var i = 0; i < queryParametersArray.length; i++) {
            let idx = queryParametersArray[i].indexOf('=');
            let parm = queryParametersArray[i].substring(0, idx);
            let val = queryParametersArray[i].substring(idx + 1);
            switch (parm) {
                case 'documentId':
                    this.documentId = val;
                    break;
                case 'workspaceId':
                    this.workspaceId = val;
                    break;
                case 'elementId':
                    this.elementId = val;
                    break;
                case 'server':
                    this.server = val;
                    break;
                case 'companyId':
                    this.companyId = val;
                    break;
                case 'userId':
                    this.userId = val;
                    break;
                case 'code':
                    this.code = val;
                    break;
                case 'clientId':
                    this.clientId = val;
                    console.log('Setting clientId=%s', this.clientId);
                    break;
                case 'locale':
                    break;
                default:
                    console.log('Did not handle %s=%s', parm, val);
            }
        }
        //
        // We need to reconstruct the redirect_uri which was used to start the application.
        // It must match EXACTLY what is put into the ActionURL redirect_uri for the extension
        // See https://onshape-public.github.io/docs/oauth/#exchanging-the-code-for-a-token
        //
        const redirect_uri = `${this.myserver}/?documentId=${this.documentId}&workspaceId=${this.workspaceId}&elementId=${this.elementId}`;
        //
        // Next we need to take the code and exchange it for authentication tokens
        // Until we get a response, we don't do anything
        //
        ExchangeToken(this.myserver + '/oauth.php', redirect_uri, this.code)
            .then((v: IExchangeToken) => {
                const now = new Date();
                const expires = new Date(now.getTime() + v.expires_in * 1000);

                // We have successfully gotten a token, time to start the app
                this.initApp(v.access_token, v.refresh_token, expires);
            })
            .catch((reason: string) => {
                // Something went wrong, so let the user know
                this.failApp(reason);
            });
    }
}
