import JsBarcode from 'jsbarcode'

export function generateBarcodeSvgString(
    value: string,
    format: string = 'CODE128',
): string {
    if (!value) return ''

    try {
        // Gunakan DOM asli jika ada, buat fake document sederhana jika di lingkungan Node.js
        let doc: any

        if (typeof document !== 'undefined') {
            doc = document
        } else {
            doc = {
                createElementNS: (_: any, type: string) => ({
                    type,
                    attribs: {} as Record<string, string>,
                    children: [] as any[],
                    textContent: '',
                    setAttribute(k: string, v: string) {
                        this.attribs[k] = String(v)
                    },
                    appendChild(c: any) {
                        this.children.push(c)
                    },
                }),
            }
        }

        const rootElement = doc.createElementNS('http://www.w3.org/2000/svg', 'svg')

        JsBarcode(rootElement, value, {
            format: format || 'CODE128',
            displayValue: true,
            fontSize: 14,
            margin: 5,
            height: 40,
            lineColor: '#000000',
            background: '#ffffff',
            xmlDocument: doc,
        })

        // Jika native DOM SVG Element
        if (rootElement.outerHTML) {
            return rootElement.outerHTML
        }

        // Fallback jika menggunakan Node.js fake document
        rootElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

        const renderNode = (node: any): string => {
            const attrs = Object.entries(node.attribs || {})
                .map(([k, v]) => `${k}="${v}"`)
                .join(' ')

            const childrenHtml = (node.children || []).map(renderNode).join('')
            const textContent = node.textContent || ''

            if (node.type === 'text') {
                return `<text ${attrs} fill="#000000" style="font-family: monospace;">${textContent}</text>`
            }

            return `<${node.type} ${attrs} fill="#000000">${textContent}${childrenHtml}</${node.type}>`
        }

        return renderNode(rootElement)
    } catch (e) {
        console.error('Error barcode SVG:', e)
        return ''
    }
}