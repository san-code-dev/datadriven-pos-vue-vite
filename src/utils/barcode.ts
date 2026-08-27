import JsBarcode from 'jsbarcode'

function stringToBase64(str: string): string {
    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
        return window.btoa(unescape(encodeURIComponent(str)))
    } else if (typeof Buffer !== 'undefined') {
        return Buffer.from(str).toString('base64')
    }
    return ''
}

export function generateBarcodeDataUri(
    value: string,
    format: string = 'CODE128',
): string {
    if (!value) return ''

    try {
        const fakeDocument = {
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

        const rootElement = fakeDocument.createElementNS('', 'svg')

        // Generate Barcode via JSBarcode
        JsBarcode(rootElement, value, {
            format: format || 'CODE128',
            displayValue: true,
            fontSize: 14,
            margin: 10,
            height: 50,
            lineColor: '#000000', // Paksa warna garis hitam murni
            xmlDocument: fakeDocument as any,
        })

        // Atribut wajib agar SVG dirender valid sebagai image src
        rootElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

        // Rekonstruksi struktur node ke string SVG
        const renderNode = (node: any): string => {
            const attrs = Object.entries(node.attribs || {})
                .map(([k, v]) => `${k}="${v}"`)
                .join(' ')

            const childrenHtml = (node.children || []).map(renderNode).join('')

            // Untuk elemen text, pastikan diberi fill hitam agar terbaca
            if (node.type === 'text') {
                return `<text ${attrs} fill="#000000" style="font-family: monospace;">${node.textContent || ''}</text>`
            }

            // Untuk elemen rect/path, berikan default fill jika diperlukan
            return `<${node.type} ${attrs} fill="#000000">${childrenHtml}</${node.type}>`
        }

        const svgContent = renderNode(rootElement)

        // Convert ke Data URI Base64
        const base64Svg = stringToBase64(svgContent)
        return `data:image/svg+xml;base64,${base64Svg}`
    } catch (e) {
        console.error('Error barcode SVG:', e)
        return ''
    }
}