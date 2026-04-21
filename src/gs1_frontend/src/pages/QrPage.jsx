// ============================================================
// GENERACION Y OPERACIONES DE CODIGO QR
// ============================================================


import { useState } from "react";
import { gs1_backend } from "declarations/gs1_backend";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import QRCard from "../components/QRCard";
import styles from "../app.module.css";
import { validateQRInputs } from "../util/gs1ValidatorQr";
import { validateGTIN } from "../util/gs1ValidatorQr";



export default function QrPage() {
    const [gtin, setGtin] = useState('');
    const [lote, setLote] = useState('');
    const [serie, setSerie] = useState('');
    const [cantidad, setCantidad] = useState(1);
    const [qrGenerados, setQrGenerados] = useState([]);
    const [dominio, setDominio] = useState("");
    const [resultado, setResultado] = useState('');

    // 0. Generar QR

    async function handleGenerarQR() {
        // Validar y normalizar todos los campos
        const validation = validateQRInputs(dominio, gtin, lote, serie, cantidad);
        if (!validation.valid) {
            setResultado(`❌ ${validation.message}`);
            return;
        }

        const { domain, gtin: normalizedGtin, lot, serial, quantity } = validation.normalized;
        const fullDominio = `https://${domain}`;

        try {
            const resp = await gs1_backend.generarYGuardarQR(fullDominio, normalizedGtin, lot, serial, quantity);
            if ("ok" in resp) {
                setQrGenerados(resp.ok.registros);
                setResultado("✅ QRs generados exitosamente.");
            } else {
                setResultado("❌ " + resp.err.mensaje);
            }
        } catch (err) {
            setResultado("❌ Error: " + err);
        }
    }

    // 1. Listar todos los QR
    async function handleListarQR() {
        const lista = await gs1_backend.listarQR();
        setQrGenerados(lista);
        setResultado("Mostrando todos los QR guardados.");
    }

    // 2. Buscar QR por GTIN

    async function handleBuscarQRporGTIN() {
        const gtinVal = validateGTIN(gtin);
        if (!gtinVal.valid) {
            setResultado(`❌ ${gtinVal.message}`);
            return;
        }
        const normalizedGtin = gtinVal.normalized;
        const resp = await gs1_backend.buscarQRporGTIN(normalizedGtin);
        if ("ok" in resp) {
            setQrGenerados(resp.ok.registros);
            setResultado(`✅ QR encontrados para GTIN ${normalizedGtin}`);
        } else {
            setResultado("❌ " + resp.err.mensaje);
            setQrGenerados([]);
        }
    }

    // 3. Generar PDF
    async function handleGenerarPDF() {
        const gtinVal = validateGTIN(gtin);
        if (!gtinVal.valid) {
            setResultado(`❌ ${gtinVal.message}`);
            return;
        }
        const normalizedGtin = gtinVal.normalized;
        try {
            const resp = await gs1_backend.buscarQRporGTIN(normalizedGtin);
            if (!("ok" in resp) || !resp.ok.registros || resp.ok.registros.length === 0) {
                setResultado("❌ No se encontraron QR para GTIN " + normalizedGtin);
                return;
            }
            const registros = resp.ok.registros;
            const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            let x = 10, y = 10;
            const qrSize = 40;
            const margin = 10;
            for (let i = 0; i < registros.length; i++) {
                const imgData = await QRCode.toDataURL(registros[i].codigoQR, { width: 160, margin: 2, errorCorrectionLevel: "H" });
                pdf.addImage(imgData, "PNG", x, y, qrSize, qrSize);
                x += qrSize + margin;
                if (x + qrSize + margin > 200) {
                    x = 10;
                    y += qrSize + 15;
                    if (y + qrSize + 10 > 290) {
                        pdf.addPage();
                        y = 10;
                    }
                }
            }
            pdf.save(`QR_${normalizedGtin}.pdf`);
            setResultado("✅ PDF generado correctamente");
        } catch (err) {
            setResultado("❌ Error al generar PDF: " + err);
        }
    }


    // 4. Generar PDF para tickets 
    async function generarPDFTickets3(gtinParam, qrSize = 40, pageWidth = 80, pageHeight = 200) {
        const gtinVal = validateGTIN(gtinParam);
        if (!gtinVal.valid) {
            alert(`❌ ${gtinVal.message}`);
            return;
        }
        const normalizedGtin = gtinVal.normalized;
        let qrList = [];
        try {
            const resp = await gs1_backend.buscarQRporGTIN(normalizedGtin);
            if ("ok" in resp && resp.ok.registros) qrList = resp.ok.registros;
            else throw new Error("No se encontraron QR");
        } catch (err) {
            alert("Error: " + err);
            return;
        }
        const pdf = new jsPDF({ unit: "mm", format: [pageWidth, pageHeight] });
        let x = 5, y = 5, gap = 5;
        for (const qr of qrList) {
            const dataUrl = await QRCode.toDataURL(qr.codigoQR, { width: qrSize, margin: 0, errorCorrectionLevel: 'H' });
            pdf.addImage(dataUrl, "PNG", x, y, qrSize, qrSize);
            y += qrSize + gap;
            if (y + qrSize > pageHeight - 5) {
                pdf.addPage();
                y = 5;
            }
        }
        pdf.save(`QR_tickets_${normalizedGtin}.pdf`);
    }

    // 5. Generar archivo TXT
    async function handleGenerarTXTporGTIN() {
        const gtinVal = validateGTIN(gtin);
        if (!gtinVal.valid) {
            setResultado(`❌ ${gtinVal.message}`);
            return;
        }
        const normalizedGtin = gtinVal.normalized;
        try {
            const resp = await gs1_backend.buscarQRporGTIN(normalizedGtin);
            if (!("ok" in resp) || !resp.ok.registros?.length) {
                setResultado("❌ No se encontraron QR");
                return;
            }
            const contenido = resp.ok.registros.map(r => r.codigoQR).join("\n");
            const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `QR_${normalizedGtin}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setResultado("📄 Archivo TXT generado");
        } catch (err) {
            setResultado("❌ Error: " + err);
        }
    }

    // 6. Generar archivo TXT
    async function handleDeleteQRporGTIN() {
        const gtinVal = validateGTIN(gtin);
        if (!gtinVal.valid) {
            setResultado(`❌ ${gtinVal.message}`);
            return;
        }
        const normalizedGtin = gtinVal.normalized;
        try {
            const resp = await gs1_backend.deleteQRporGTIN(normalizedGtin);
            if ("ok" in resp) {
                setResultado(`✅ Eliminados todos los QR del GTIN ${normalizedGtin}`);
                setQrGenerados([]);
            } else {
                setResultado("❌ " + resp.err.mensaje);
            }
        } catch (err) {
            setResultado("❌ Error: " + err);
        }
    }

    return (
        <>
            {/* Generar QR */}
            <div className={styles.formSection}>
                <h3>Generar Códigos QR</h3>
                <input className={styles.input} placeholder="midominio.com" value={dominio} onChange={e => setDominio(e.target.value)} />
                <input className={styles.input} placeholder="GTIN" value={gtin} onChange={e => setGtin(e.target.value)} />
                <input className={styles.input} placeholder="Lote" value={lote} onChange={e => setLote(e.target.value)} />
                <input className={styles.input} placeholder="Serie inicial" value={serie} onChange={e => setSerie(e.target.value)} />
                <label htmlFor="cantidad" style={{ display: 'block', marginTop: '8px', fontSize: '14px', color: '#555' }}>
                    Cantidad:
                </label>
                <input className={styles.input} placeholder="Cantidad" type="number" value={cantidad} onChange={e => setCantidad(Number(e.target.value))} />
                <button onClick={handleGenerarQR}>⚙️ Generar QR</button>
            </div>

            {/* Operaciones con QR */}
            <div className={styles.formSection}>
                <h3>Operaciones con Códigos QR</h3>
                <div className={styles.buttonGroup}>
                    <button onClick={handleListarQR}>📋 Mostrar todos</button>
                    <button onClick={handleBuscarQRporGTIN}>🔍 Buscar por GTIN</button>
                    <button onClick={handleGenerarPDF}>🖨️ PDF (A4)</button>
                    <button onClick={() => generarPDFTickets3(gtin, 40, 80, 200)}>🖨️ PDF Ticket</button>
                    <button onClick={handleGenerarTXTporGTIN}>📄 Exportar TXT</button>
                    <button onClick={handleDeleteQRporGTIN}>🗑️ Eliminar codigos por GTIN</button>
                </div>
            </div>

            {/* Resultado */}
            <section className={styles.resultado}>{resultado || 'Resultados QR'}</section>

            {/* Lista de QR */}
            {qrGenerados.length > 0 && (
                <div className={styles.formSection}>
                    <h3>QR generados/encontrados:</h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                        {qrGenerados.map((item, idx) => (
                            <QRCard key={idx} item={item} />
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}