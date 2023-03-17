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
 */ //         <label for="magic">Select a List</label>

export interface JTSelectItem {
    value: string;
    label: string;
    selected?: boolean;
}
type onFunction = (e: any) => any;

export function JTmakeSelectList(
    id: string,
    label: string,
    classname: string,
    items: JTSelectItem[],
    onchange: onFunction
): HTMLElement {
    const div = document.createElement('div');
    const lbl = document.createElement('label');
    lbl.setAttribute('for', label);
    div.appendChild(lbl);
    const select = document.createElement('select');
    select.onchange = onchange;
    select.setAttribute('id', id);
    select.setAttribute('name', id);
    if (classname !== '' && classname !== undefined) {
        select.classList.add(classname);
    }
    div.append(select);
    for (let item of items) {
        const option = document.createElement('option');
        option.value = item.value;
        option.text = item.label;
        if (item.selected) {
            option.selected = true;
        }
        select.appendChild(option);
    }
    return div;
}
