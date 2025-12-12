// ==========================================
// ☁️ CONEXIÓN A LA NUBE (FIREBASE)
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔑 SUS LLAVES SECRETAS (Ya configuradas)
const firebaseConfig = {
  apiKey: "AIzaSyChKhzs-cBYxqqoh5_eOFS8SZIHVs8lFH4",
  authDomain: "credisur-k-aa898.firebaseapp.com",
  projectId: "credisur-k-aa898",
  storageBucket: "credisur-k-aa898.firebasestorage.app",
  messagingSenderId: "163253574924",
  appId: "1:163253574924:web:ab4a7db3567f09fcc67d29"
};

// Inicializar la Nube
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PIN_SECRET = "2025"; 
let imagenBase64 = ""; 

// ==========================================
// 🔒 LOGIN
// ==========================================
const pinInput = document.getElementById('pin');
if (pinInput) {
    pinInput.focus();
    pinInput.addEventListener('keyup', (e) => {
        if (e.target.value === PIN_SECRET) {
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('app').style.display = 'block';
            cargarConfig(); 
            iniciarSincronizacion(); // 🔥 AQUÍ EMPIEZA LA MAGIA
        }
    });
}
window.cerrarSesion = function() { location.reload(); }

// ==========================================
// 📡 SINCRONIZACIÓN EN VIVO (REALTIME)
// ==========================================
let listaCasosGlobal = []; // Para guardar los datos en memoria y poder buscar

function iniciarSincronizacion() {
    // Esto se queda "escuchando" cambios en la nube
    const q = query(collection(db, "casos"), orderBy("id", "desc"));
    
    onSnapshot(q, (snapshot) => {
        listaCasosGlobal = []; // Limpiar memoria
        let pendientes = 0, tramite = 0, solucionados = 0;

        snapshot.forEach((doc) => {
            const caso = doc.data();
            caso.firebaseId = doc.id; // ID único de la nube
            listaCasosGlobal.push(caso);

            // Contadores
            if(caso.estado_proceso === 'PENDIENTE') pendientes++;
            if(caso.estado_proceso === 'TRAMITE') tramite++;
            if(caso.estado_proceso === 'SOLUCIONADO') solucionados++;
        });

        // Actualizar Dashboard
        document.getElementById('count-pendientes').innerText = pendientes;
        document.getElementById('count-tramite').innerText = tramite;
        document.getElementById('count-solucionados').innerText = solucionados;

        // Dibujar lista
        renderizarLista(listaCasosGlobal);
    });
}

function renderizarLista(lista) {
    const listaDiv = document.getElementById('lista');
    listaDiv.innerHTML = "";

    lista.forEach(caso => {
        let colorEstado = "#FFC107"; // Naranja
        if(caso.estado_proceso === 'SOLUCIONADO') colorEstado = "#00C853"; // Verde
        if(caso.estado_proceso === 'NEGADO') colorEstado = "#FF5252"; // Rojo
        if(caso.estado_proceso === 'TRAMITE') colorEstado = "#2196F3"; // Azul

        const badgeTipo = caso.tipo === 'PREVENTA' ? '<span class="badge b-preventa">PREVENTA</span>' : '<span class="badge b-postventa">POSTVENTA</span>';
        
        let htmlFoto = "";
        if (caso.foto) htmlFoto = `<div style="margin-top:10px; text-align:center;"><img src="${caso.foto}" class="thumb-preview" onclick="window.abrirImagen('${caso.foto}')"></div>`;

        // Bitácora
        let bitacoraHtml = "";
        if(caso.bitacora) {
            bitacoraHtml = caso.bitacora.map(e => `<div class="timeline-event"><div class="event-date">${e.fecha}</div><div style="font-size:13px">${e.nota}</div></div>`).join('');
        }

        const html = `
            <div class="garantia-item" style="border-left: 5px solid ${colorEstado}">
                <div class="item-header">
                    <div>
                        ${badgeTipo} <strong style="color:var(--primary)">${caso.marca || ''}</strong>
                        <h3 class="item-title">${caso.producto}</h3>
                        <div class="item-meta">${caso.cliente} | CC: ${caso.cedula}</div>
                    </div>
                    <div style="text-align:right">
                        <select onchange="window.cambiarEstado('${caso.firebaseId}', this.value)" style="padding:5px; background:${colorEstado}; color:#000; font-weight:bold; border:none; border-radius:4px;">
                            <option value="PENDIENTE" ${caso.estado_proceso === 'PENDIENTE' ? 'selected' : ''}>⏳ PENDIENTE</option>
                            <option value="TRAMITE" ${caso.estado_proceso === 'TRAMITE' ? 'selected' : ''}>🔧 EN TALLER</option>
                            <option value="SOLUCIONADO" ${caso.estado_proceso === 'SOLUCIONADO' ? 'selected' : ''}>✅ SOLUCIONADO</option>
                            <option value="NEGADO" ${caso.estado_proceso === 'NEGADO' ? 'selected' : ''}>🚫 NEGADO</option>
                        </select>
                        <br><br>
                        <button class="btn-action" style="background:transparent; border:1px solid #555; color:#aaa; font-size:12px; padding:5px 10px;" onclick="window.toggleDetalles('${caso.firebaseId}')">ADMINISTRAR ▼</button>
                    </div>
                </div>

                <div id="detalles-${caso.firebaseId}" class="item-details">
                    <div class="edit-panel">
                        <span class="edit-title">✏️ EDICIÓN RÁPIDA (MODO DIOS)</span>
                        <div class="form-grid">
                            <div class="col-half"><input type="text" id="edit-nom-${caso.firebaseId}" value="${caso.cliente}" placeholder="Cliente"></div>
                            <div class="col-half"><input type="number" id="edit-ced-${caso.firebaseId}" value="${caso.cedula}" placeholder="CC"></div>
                            <div class="col-half"><input type="text" id="edit-prod-${caso.firebaseId}" value="${caso.producto}" placeholder="Producto"></div>
                            <div class="col-half"><input type="text" id="edit-marca-${caso.firebaseId}" value="${caso.marca || ''}" placeholder="Marca"></div>
                            <div class="col-full"><input type="text" id="edit-prov-${caso.firebaseId}" value="${caso.proveedor}" placeholder="Proveedor"></div>
                            <div class="col-half"><input type="text" id="edit-cel1-${caso.firebaseId}" value="${caso.cel1}" placeholder="Cel 1"></div>
                            <div class="col-half"><input type="text" id="edit-cel2-${caso.firebaseId}" value="${caso.cel2}" placeholder="Cel 2"></div>
                            <div class="col-full"><input type="text" id="edit-dir-${caso.firebaseId}" value="${caso.direccion}" placeholder="Dirección"></div>
                            <div class="col-half"><input type="text" id="edit-ser-${caso.firebaseId}" value="${caso.serial}" placeholder="Serial"></div>
                            <div class="col-half"><input type="text" id="edit-rad-${caso.firebaseId}" value="${caso.radicado}" placeholder="Radicado"></div>
                        </div>
                        <button onclick="window.guardarEdicion('${caso.firebaseId}')" class="btn-main" style="margin-top:10px; padding:10px; font-size:14px;">ACTUALIZAR DATOS</button>
                    </div>

                    <p style="background:#222; padding:10px; border-radius:4px;"><strong>📝 Falla:</strong> ${caso.problema}</p>
                    ${htmlFoto}

                    <h4 style="color:#aaa; border-bottom:1px solid #333; margin-top:20px;">📜 Bitácora</h4>
                    <div class="timeline">${bitacoraHtml}</div>

                    <button onclick="window.borrarCaso('${caso.firebaseId}')" style="color:var(--danger); background:none; border:none; margin-top:20px; float:right;">🗑️ ELIMINAR</button>
                    <div style="clear:both"></div>
                </div>
            </div>`;
        listaDiv.innerHTML += html;
    });
}

// ==========================================
// 💾 GUARDAR EN LA NUBE (CREATE)
// ==========================================
window.registrarCaso = async function() {
    const tipo = document.getElementById('tipo-gestion').value;
    let proveedorFinal = document.getElementById('proveedor').value;
    if (tipo === "PREVENTA") proveedorFinal = "ALMACÉN / KAREN";

    const nuevoCaso = {
        id: Date.now(), // Para ordenar
        creado: new Date().toLocaleString(),
        tipo: tipo,
        estado_proceso: "PENDIENTE",
        cliente: document.getElementById('nombre').value.toUpperCase(),
        cedula: document.getElementById('cedula').value,
        cel1: document.getElementById('cel1').value,
        cel2: document.getElementById('cel2').value,
        direccion: document.getElementById('direccion').value.toUpperCase(),
        proveedor: proveedorFinal,
        marca: document.getElementById('marca').value.toUpperCase(),
        producto: document.getElementById('producto').value.toUpperCase(),
        serial: document.getElementById('serial').value,
        radicado: document.getElementById('radicado').value || "S/N",
        problema: document.getElementById('problema').value,
        fechaCompra: document.getElementById('fechaCompra').value,
        foto: imagenBase64,
        bitacora: [{ fecha: new Date().toLocaleString(), nota: "Expediente creado en la Nube ☁️." }]
    };

    if (!nuevoCaso.cliente || !nuevoCaso.producto) return alert("⚠️ Falta Nombre o Producto.");

    try {
        await addDoc(collection(db, "casos"), nuevoCaso);
        alert("✅ ¡Guardado en la Nube!");
        window.limpiarFormulario();
    } catch (e) {
        console.error("Error: ", e);
        alert("🚨 Error guardando. Revise su internet.");
    }
}

// ==========================================
// ✏️ ACTUALIZAR Y BORRAR (UPDATE / DELETE)
// ==========================================
window.guardarEdicion = async function(firebaseId) {
    const casoRef = doc(db, "casos", firebaseId);
    try {
        await updateDoc(casoRef, {
            cliente: document.getElementById(`edit-nom-${firebaseId}`).value.toUpperCase(),
            cedula: document.getElementById(`edit-ced-${firebaseId}`).value,
            producto: document.getElementById(`edit-prod-${firebaseId}`).value.toUpperCase(),
            marca: document.getElementById(`edit-marca-${firebaseId}`).value.toUpperCase(),
            proveedor: document.getElementById(`edit-prov-${firebaseId}`).value.toUpperCase(),
            cel1: document.getElementById(`edit-cel1-${firebaseId}`).value,
            cel2: document.getElementById(`edit-cel2-${firebaseId}`).value,
            direccion: document.getElementById(`edit-dir-${firebaseId}`).value.toUpperCase(),
            serial: document.getElementById(`edit-ser-${firebaseId}`).value,
            radicado: document.getElementById(`edit-rad-${firebaseId}`).value
        });
        alert("✅ Actualizado en todos los dispositivos.");
    } catch (e) { alert("Error: " + e.message); }
}

window.cambiarEstado = async function(firebaseId, nuevoEstado) {
    const casoRef = doc(db, "casos", firebaseId);
    await updateDoc(casoRef, { estado_proceso: nuevoEstado });
}

window.borrarCaso = async function(firebaseId) {
    if(confirm("⚠ ¿ELIMINAR DE LA NUBE PARA SIEMPRE?")) {
        await deleteDoc(doc(db, "casos", firebaseId));
    }
}

window.buscar = function() {
    const texto = document.getElementById('buscador').value.toUpperCase();
    const filtrados = listaCasosGlobal.filter(c => 
        c.cliente.includes(texto) || c.cedula.includes(texto) || c.radicado.includes(texto)
    );
    renderizarLista(filtrados);
}

// ==========================================
// 📸 UTILIDADES (FOTO, IA, CONFIG)
// ==========================================
// Compresor de fotos
document.getElementById('input-foto').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function(event) {
            const img = new Image();
            img.src = event.target.result;
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800; 
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                imagenBase64 = canvas.toDataURL('image/jpeg', 0.6);
                document.getElementById('img-preview').src = imagenBase64;
                document.getElementById('preview-container').style.display = 'block';
            }
        }
    }
});

window.limpiarFormulario = function() {
    document.querySelectorAll('input, textarea').forEach(i => i.value = "");
    imagenBase64 = "";
    document.getElementById('img-preview').src = "";
    document.getElementById('preview-container').style.display = "none";
}

// Configuración Local de Proveedores
window.abrirConfig = function() { document.getElementById('config-panel').style.display = 'block'; }
window.cerrarConfig = function() { document.getElementById('config-panel').style.display = 'none'; }
window.cargarConfig = function() {
    const defecto = ["CORVETA", "J&R", "MUNDIAL", "MADERKIT", "ELECTROJAPONESA", "JLC", "HACEB DIRECTO", "ALMACEN / KAREN"];
    let config = JSON.parse(localStorage.getItem('credisur_config')) || defecto;
    const select = document.getElementById('proveedor');
    select.innerHTML = "";
    config.forEach(prov => { select.innerHTML += `<option value="${prov}">${prov}</option>`; });
    const listaConfig = document.getElementById('lista-proveedores');
    listaConfig.innerHTML = "";
    config.forEach(prov => {
        listaConfig.innerHTML += `<div class="tag-prov">${prov} <button class="btn-x" onclick="borrarProveedor('${prov}')">x</button></div>`;
    });
}
window.agregarProveedor = function() {
    const nuevo = document.getElementById('nuevo-proveedor').value.toUpperCase().trim();
    if(!nuevo) return;
    let config = JSON.parse(localStorage.getItem('credisur_config')) || [];
    if(!config.includes(nuevo)) {
        config.push(nuevo);
        localStorage.setItem('credisur_config', JSON.stringify(config));
        document.getElementById('nuevo-proveedor').value = "";
        window.cargarConfig();
    }
}
window.borrarProveedor = function(nombre) {
    if(confirm("¿Borrar?")) {
        let config = JSON.parse(localStorage.getItem('credisur_config')) || [];
        config = config.filter(p => p !== nombre);
        localStorage.setItem('credisur_config', JSON.stringify(config));
        window.cargarConfig();
    }
}
window.verificarTipo = function() {
    const tipo = document.getElementById('tipo-gestion').value;
    const selectProv = document.getElementById('proveedor');
    if (tipo === 'PREVENTA') { selectProv.disabled = true; } else { selectProv.disabled = false; }
}

// IA WhatsApp (Igual que antes)
window.iaCompletar = function() {
    const texto = document.getElementById('texto-whatsapp').value;
    if (!texto) return alert("⚠️ Pegue mensaje.");
    const lineas = texto.split('\n');
    const basura = ["hola", "buenos", "buenas", "dias", "tardes", "noches", "saludo", "sr", "sra", "señor", "señora", "don", "doña", "te", "le", "envio", "adjunto", "la", "el", "orden", "de", "servicio", "para", "snt", "sñt", "luz", "cc", "c.c", "cedula", "numero", "cliente", "nombre"];

    let radicadoDetectado = "";
    const matchRad = texto.match(/(?:orden|radicado|servicio|ticket|caso)[^\d]*(\d{5,15})/i);
    if (matchRad) { radicadoDetectado = matchRad[1]; document.getElementById('radicado').value = radicadoDetectado; }

    const posiblesNumeros = texto.match(/\b(?!3)\d{7,10}\b/g);
    if (posiblesNumeros) {
        const cedulaReal = posiblesNumeros.find(num => num !== radicadoDetectado);
        if (cedulaReal) {
            document.getElementById('cedula').value = cedulaReal;
            lineas.forEach((linea) => {
                if (linea.includes(cedulaReal) || (linea.toUpperCase().includes(cedulaReal) === false)) {
                     let letras = linea.replace(/[0-9]/g, '').replace(/[:.-]/g, '').trim();
                     if(letras.length > 4) {
                         let palabras = letras.split(" ");
                         let nombreLimpio = palabras.filter(p => !basura.includes(p.toLowerCase())).join(" ");
                         if (nombreLimpio.length > 3 && !nombreLimpio.toLowerCase().includes("calle")) {
                            if(document.getElementById('nombre').value === "") document.getElementById('nombre').value = nombreLimpio.toUpperCase();
                         }
                     }
                }
            });
        }
    }
    const celulares = texto.match(/\b3\d{9}\b/g);
    if (celulares) {
        if (celulares[0]) document.getElementById('cel1').value = celulares[0];
        if (celulares[1]) document.getElementById('cel2').value = celulares[1];
    }
    const marcasConocidas = ["SAMSUNG", "LG", "HACEB", "OSTER", "SAMURAI", "KALLEY", "MABE", "CHALLENGER", "ABBA", "ELECTROLUX", "WHIRLPOOL", "IMUSA"];
    const productosConocidos = ["NEVERA", "LAVADORA", "LICUADORA", "VENTILADOR", "ESTUFA", "HORNO", "TELEVISOR", "TV", "AIRE", "CONGELADOR"];
    lineas.forEach(linea => {
        const lineaUp = linea.toUpperCase();
        marcasConocidas.forEach(m => { if (lineaUp.includes(m)) document.getElementById('marca').value = m; });
        productosConocidos.forEach(p => {
            if (lineaUp.includes(p) && !lineaUp.includes("SUENA") && !lineaUp.includes("REPARAR")) {
                document.getElementById('producto').value = linea.trim().toUpperCase();
            }
        });
    });
    const palabrasDir = ["barrio", "calle", "cra", "carrera", "vereda", "villa", "manzana", "lote", "casa", "polideportivo", "km", "salida"];
    let dirFull = "";
    lineas.forEach(linea => {
        if (palabrasDir.some(p => linea.toLowerCase().includes(p))) { dirFull = linea.trim(); }
        if (linea.toLowerCase().includes("villagarzon")) dirFull += " (VILLAGARZÓN)";
        if (linea.toLowerCase().includes("puerto") || linea.toLowerCase().includes("asis")) dirFull += " (PUERTO ASÍS)";
    });
    if (dirFull) document.getElementById('direccion').value = dirFull.toUpperCase();
    const palabrasFalla = ["suena", "prende", "congela", "escarcha", "ruido", "golpea", "daño", "falla", "reparacion", "garantia"];
    lineas.forEach(linea => {
        if (palabrasFalla.some(p => linea.toLowerCase().includes(p))) { document.getElementById('problema').value = linea.trim(); }
    });
    alert("✨ Datos Extraídos (IA V5).");
}
window.toggleDetalles = function(id) { 
    const d = document.getElementById(`detalles-${id}`); 
    d.style.display = d.style.display === 'block' ? 'none' : 'block'; 
}
window.abrirImagen = function(src) {
    document.getElementById("image-modal").style.display = "block";
    document.getElementById("img-full").src = src;
}
window.cerrarModal = function() { document.getElementById("image-modal").style.display = "none"; }