import JsBarcode from 'jsbarcode'

export function generateBarcodeSvgString(
    value: string,
    format: string = 'CODE128',
): string {
    if (!value) return ''

    try {
        // 1. Buat elemen SVG asli di memori browser
        const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

        // 2. Render barcode langsung menggunakan elemen SVG asli
        JsBarcode(svgNode, value, {
            format: format || 'CODE128',
            displayValue: true,
            fontSize: 14,
            margin: 10,
            height: 50,
            lineColor: '#000000',
            background: '#ffffff',
        })

        // 3. Ambil string HTML dari elemen SVG yang berhasil di-render
        return svgNode.outerHTML
    } catch (e) {
        console.error('Error barcode SVG:', e)
        return ''
    }
}