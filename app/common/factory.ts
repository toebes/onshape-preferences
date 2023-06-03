export namespace JSXFactory {
    const Fragment = '<></>';

    export interface AttributeCollection {
        [name: string]: any;
    }

    export function createElement(
        tagName: string,
        attributes: JSXFactory.AttributeCollection | null,
        ...children: any[]
    ): Element | DocumentFragment {
        if (tagName === Fragment) {
            return document.createDocumentFragment();
        }
        // Support for components(ish)
        if (typeof tagName === 'function') {
            attributes = attributes || {};
            const stack: any[] = [...children];
            attributes.children = stack;
            const tagfunc: (attributes: JSXFactory.AttributeCollection) => any = tagName;
            return tagfunc(attributes);
        }
        const element = document.createElement(tagName);
        if (attributes) {
            for (const key of Object.keys(attributes)) {
                const attributeValue = attributes[key];

                if (key === 'className') {
                    // JSX does not allow class as a valid name
                    element.setAttribute('class', attributeValue);
                } else if (
                    key.startsWith('on') &&
                    typeof attributes[key] === 'function'
                ) {
                    element.addEventListener(key.substring(2), attributeValue);
                } else {
                    // <input disable />      { disable: true }
                    // <input type="text" />  { type: "text"}
                    if (typeof attributeValue === 'boolean' && attributeValue) {
                        element.setAttribute(key, '');
                    } else if (attributeValue !== undefined) {
                        element.setAttribute(key, attributeValue);
                    }
                }
            }
        }

        for (const child of children) {
            appendChild(element, child);
        }

        return element;
    }

    function appendChild(parent: Node, child: any) {
        if (typeof child === 'undefined' || child === null) {
            return;
        }

        if (Array.isArray(child)) {
            for (const value of child) {
                appendChild(parent, value);
            }
        } else if (typeof child === 'string') {
            parent.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            parent.appendChild(child);
        } else if (typeof child === 'boolean') {
            // <>{condition && <a>Display when condition is true</a>}</>
            // if condition is false, the child is a boolean, but we don't want to display anything
        } else {
            parent.appendChild(document.createTextNode(String(child)));
        }
    }
}
