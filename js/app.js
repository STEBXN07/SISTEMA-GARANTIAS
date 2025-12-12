// --- SEGURIDAD ---
const PIN_SECRET = "2025"; 
document.getElementById('pin').addEventListener('keyup', (e) => {
    if (e.target.value === PIN_SECRET) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        cargarCasos();
    }
});

function cerrarSesion() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
    document.getElementById('pin').value = '';
}

// --- LÓGICA DE NEGOCIO ---

function registrarCaso() {
    // 1. Capturar datos
    const nuevoCaso = {
        id: Date.now(),
        creado: new Date().toISOString(),
        cliente: document.getElementById('nombre').value,
        cedula: document.getElementById('cedula').value,
        cel1: document.getElementById('cel1').value,
        cel2: document.getElementById('cel2').value,
        direccion: document.getElementById('direccion').value,
        proveedor: document.getElementById('proveedor').value,
        producto: document.getElementById('producto').value,
        serial: document.getElementById('serial').value,
        radicado: document.getElementById('radicado').value || "Pendiente",
        problema: document.getElementById('problema').value,
        fechaCompra: document.getElementById('fechaCompra').value,
        // AQUÍ ESTÁ LA MAGIA: BITÁCORA
        bitacora: [
            { fecha: new Date().toLocaleString(), nota: "Caso creado en el sistema." }
        ]
    };

    if (!nuevoCaso.cliente || !nuevoCaso.cedula || !nuevoCaso.producto) {
        alert("⚠️ Faltan datos obligatorios");
        return;
    }

    // 2. Guardar
    let db = JSON.parse(localStorage.getItem('credisur_db_v4')) || [];
    db.unshift(nuevoCaso);
    localStorage.setItem('credisur_db_v4', JSON.stringify(db));

    alert("✅ Expediente Creado");
    location.reload();
}

function cargarCasos(filtro = "") {
    const listaDiv = document.getElementById('lista');
    listaDiv.innerHTML = "";
    let db = JSON.parse(localStorage.getItem('credisur_db_v4')) || [];

    if (filtro) {
        db = db.filter(c => 
            c.cliente.toLowerCase().includes(filtro) || 
            c.cedula.includes(filtro) || 
            c.radicado.toLowerCase().includes(filtro)
        );
    }

    db.forEach(caso => {
        // Calcular si está vencido
        const fCompra = new Date(caso.fechaCompra);
        const fVence = new Date(fCompra);
        fVence.setFullYear(fCompra.getFullYear() + 1);
        const hoy = new Date();
        const estadoGarantia = hoy < fVence ? "✅ VIGENTE" : "❌ VENCIDA";

        // Renderizar Bitácora (Notas)
        let htmlBitacora = "";
        caso.bitacora.forEach(evento => {
            htmlBitacora += `
                <div class="timeline-event">
                    <div class="event-date">${evento.fecha}</div>
                    <div class="event-desc">${evento.nota}</div>
                </div>
            `;
        });

        const html = `
            <div class="garantia-item">
                <div class="item-header">
                    <div>
                        <h3 style="margin:0; color:white;">${caso.producto} (${caso.proveedor})</h3>
                        <small style="color:var(--primary)">${caso.cliente} | Rad: ${caso.radicado}</small>
                    </div>
                    <div style="text-align:right">
                        <small>${estadoGarantia}</small><br>
                        <button class="btn-ver" onclick="toggleDetalles(${caso.id})">Administrar ▼</button>
                    </div>
                </div>

                <div id="detalles-${caso.id}" class="item-details">
                    <p><strong>📍 Ubicación:</strong> ${caso.direccion}</p>
                    <p><strong>📞 Contactos:</strong> ${caso.cel1} / ${caso.cel2}</p>
                    <p><strong>🔧 Falla:</strong> ${caso.problema}</p>
                    <p><strong>🔢 Serial:</strong> ${caso.serial}</p>
                    
                    <h4 style="color:#aaa; border-bottom:1px solid #333; margin-top:20px;">📜 Bitácora de Eventos</h4>
                    <div class="timeline" id="timeline-${caso.id}">
                        ${htmlBitacora}
                    </div>

                    <div class="new-note-area">
                        <input type="text" id="nota-${caso.id}" placeholder="Ej: Llegó Orden de Servicio #555...">
                        <button class="btn-add-note" onclick="agregarNota(${caso.id})">➕</button>
                    </div>

                    <button onclick="borrarCaso(${caso.id})" style="color:red; background:none; border:none; margin-top:20px; float:right; cursor:pointer;">🗑️ Eliminar Expediente</button>
                    <div style="clear:both"></div>
                </div>
            </div>
        `;
        listaDiv.innerHTML += html;
    });
}

function agregarNota(id) {
    const input = document.getElementById(`nota-${id}`);
    const texto = input.value;
    if (!texto) return;

    let db = JSON.parse(localStorage.getItem('credisur_db_v4')) || [];
    const index = db.findIndex(c => c.id === id);
    
    if (index !== -1) {
        db[index].bitacora.push({
            fecha: new Date().toLocaleString(),
            nota: texto
        });
        localStorage.setItem('credisur_db_v4', JSON.stringify(db));
        cargarCasos(document.getElementById('buscador').value.toLowerCase());
    }
}

function toggleDetalles(id) {
    const div = document.getElementById(`detalles-${id}`);
    div.style.display = div.style.display === 'block' ? 'none' : 'block';
}

function buscar() {
    cargarCasos(document.getElementById('buscador').value.toLowerCase());
}

function borrarCaso(id) {
    if(confirm("¿Borrar este caso y todo su historial?")) {
        let db = JSON.parse(localStorage.getItem('credisur_db_v4')) || [];
        db = db.filter(c => c.id !== id);
        localStorage.setItem('credisur_db_v4', JSON.stringify(db));
        cargarCasos();
    }
}