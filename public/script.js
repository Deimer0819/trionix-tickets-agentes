// ---------------------------------------------------------------------
// Datos que el navegador tiene guardados (se llenan con la API)
// ---------------------------------------------------------------------
let tickets = [];
let agentes = [];

// ---------------------------------------------------------------------
// Elementos del HTML con los que vamos a trabajar
// ---------------------------------------------------------------------
const mensajeEl = document.getElementById("mensaje");
const formTicket = document.getElementById("form-ticket");
const formAgente = document.getElementById("form-agente");
const listaTickets = document.getElementById("lista-tickets");
const listaAgentes = document.getElementById("lista-agentes");

// ---------------------------------------------------------------------
// Función que habla con la API.
// Si la API responde con error (400, 404, 409...), lanza un Error con el
// mensaje que armó el backend, para mostrarlo de forma legible.
// ---------------------------------------------------------------------
async function api(url, opciones = {}) {
  let res;
  try {
    res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...opciones,
    });
  } catch (err) {
    throw new Error("No se pudo conectar con el servidor. Intenta de nuevo.");
  }

  if (res.status === 204) return null; // 204 = todo bien, sin contenido (al eliminar)

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Ocurrió un error inesperado.");
  return data;
}

// ---------------------------------------------------------------------
// Mensajes de error y de éxito
// ---------------------------------------------------------------------
function mostrarMensaje(texto, tipo) {
  mensajeEl.textContent = texto;
  mensajeEl.className = `mensaje ${tipo}`; // tipo: "error" u "ok"
  mensajeEl.hidden = false;
}

function ocultarMensaje() {
  mensajeEl.hidden = true;
}

// ---------------------------------------------------------------------
// Cargar datos desde la API y dibujarlos
// ---------------------------------------------------------------------
async function cargarTodo() {
  try {
    tickets = await api("/api/tickets");
    agentes = await api("/api/agentes");
    dibujar();
  } catch (err) {
    mostrarMensaje(err.message, "error");
  }
}

// Evita que un texto con código HTML se ejecute en la página
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function dibujar() {
  // --- Lista de agentes ---
  if (agentes.length === 0) {
    listaAgentes.innerHTML = '<li class="vacio">Todavía no hay agentes.</li>';
  } else {
    listaAgentes.innerHTML = agentes
      .map(
        (a) => `
        <li class="agente-item">
          <span><strong>${escapeHtml(a.nombre)}</strong> · ${escapeHtml(a.especialidad)}<br />
            <small>${escapeHtml(a.email)}</small></span>
          <span class="badge ${a.activo ? "badge-resuelto" : "badge-alta"}">${a.activo ? "Activo" : "Inactivo"}</span>
        </li>`
      )
      .join("");
  }

  // --- Lista de tickets ---
  if (tickets.length === 0) {
    listaTickets.innerHTML = '<li class="vacio">Todavía no hay tickets.</li>';
  } else {
    listaTickets.innerHTML = tickets.map(crearTicketHTML).join("");
  }
}

function crearTicketHTML(ticket) {
  // El backend devuelve "agente" ya resuelto (o null si no hay nadie asignado)
  const agenteTexto = ticket.agente
    ? `${escapeHtml(ticket.agente.nombre)} (${escapeHtml(ticket.agente.especialidad)})`
    : "Sin asignar";

  // Opciones del <select>: solo los agentes activos
  const opciones = agentes
    .filter((a) => a.activo)
    .map((a) => {
      const marcado = ticket.agente && ticket.agente._id === a._id ? "selected" : "";
      return `<option value="${a._id}" ${marcado}>${escapeHtml(a.nombre)} - ${escapeHtml(a.especialidad)}</option>`;
    })
    .join("");

  const comentarios = ticket.comentarios
    .map((c) => `<li><strong>${escapeHtml(c.autor)}:</strong> ${escapeHtml(c.texto)}</li>`)
    .join("");

  return `
    <li class="ticket-item ${ticket.estado}" data-id="${ticket._id}">
      <div>
        <div class="ticket-cliente">${escapeHtml(ticket.cliente)}</div>
        <div>${escapeHtml(ticket.asunto)}</div>
      </div>

      <div class="ticket-meta">
        <span class="badge badge-${ticket.prioridad}">${ticket.prioridad}</span>
        <span class="badge badge-${ticket.estado}">${ticket.estado}</span>
        <span class="agente-linea">Agente: ${agenteTexto}</span>
      </div>

      <div class="asignar">
        <select>
          <option value="">— Elegir agente —</option>
          ${opciones}
        </select>
        <button type="button" class="btn btn-sec" data-accion="asignar">Asignar</button>
      </div>

      <div class="acciones">
        ${
          ticket.estado === "abierto"
            ? '<button type="button" class="btn btn-exito" data-accion="resolver">Marcar como resuelto</button>'
            : ""
        }
        <button type="button" class="btn btn-peligro" data-accion="eliminar">Eliminar</button>
      </div>

      ${comentarios ? `<ul class="comentarios">${comentarios}</ul>` : ""}

      <form class="form-comentario">
        <input name="autor" type="text" placeholder="Tu nombre" />
        <input name="texto" type="text" placeholder="Escribe un comentario" />
        <button type="submit" class="btn btn-sec">Comentar</button>
      </form>
    </li>`;
}

// ---------------------------------------------------------------------
// Crear ticket
// ---------------------------------------------------------------------
formTicket.addEventListener("submit", async (e) => {
  e.preventDefault(); // evita que el navegador recargue la página
  ocultarMensaje();

  const datos = {
    cliente: formTicket.elements.cliente.value,
    asunto: formTicket.elements.asunto.value,
    prioridad: formTicket.elements.prioridad.value,
  };

  try {
    await api("/api/tickets", { method: "POST", body: JSON.stringify(datos) });
    formTicket.reset();
    await cargarTodo();
    mostrarMensaje("Ticket creado correctamente.", "ok");
  } catch (err) {
    mostrarMensaje(err.message, "error");
  }
});

// ---------------------------------------------------------------------
// Crear agente
// ---------------------------------------------------------------------
formAgente.addEventListener("submit", async (e) => {
  e.preventDefault();
  ocultarMensaje();

  const datos = {
    nombre: formAgente.elements.nombre.value,
    email: formAgente.elements.email.value,
    especialidad: formAgente.elements.especialidad.value,
  };

  try {
    await api("/api/agentes", { method: "POST", body: JSON.stringify(datos) });
    formAgente.reset();
    await cargarTodo();
    mostrarMensaje("Agente creado correctamente.", "ok");
  } catch (err) {
    mostrarMensaje(err.message, "error"); // aquí sale, por ejemplo, el aviso de correo repetido
  }
});

// ---------------------------------------------------------------------
// Botones de cada ticket: asignar, resolver, eliminar
// (un solo "escucha-clics" para toda la lista)
// ---------------------------------------------------------------------
listaTickets.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-accion]");
  if (!btn) return;

  const item = btn.closest(".ticket-item");
  const id = item.dataset.id;
  ocultarMensaje();

  try {
    if (btn.dataset.accion === "asignar") {
      const agenteId = item.querySelector("select").value;
      if (!agenteId) {
        mostrarMensaje("Primero elige un agente de la lista.", "error");
        return;
      }
      await api(`/api/tickets/${id}/asignar`, { method: "POST", body: JSON.stringify({ agenteId }) });
      await cargarTodo();
      mostrarMensaje("Agente asignado correctamente.", "ok");
    }

    if (btn.dataset.accion === "resolver") {
      await api(`/api/tickets/${id}`, { method: "PUT", body: JSON.stringify({ estado: "resuelto" }) });
      await cargarTodo();
      mostrarMensaje("Ticket marcado como resuelto.", "ok");
    }

    if (btn.dataset.accion === "eliminar") {
      if (!confirm("¿Seguro que quieres eliminar este ticket? Esta acción no se puede deshacer.")) return;
      await api(`/api/tickets/${id}`, { method: "DELETE" });
      await cargarTodo();
      mostrarMensaje("Ticket eliminado.", "ok");
    }
  } catch (err) {
    mostrarMensaje(err.message, "error");
  }
});

// ---------------------------------------------------------------------
// Agregar un comentario a un ticket
// ---------------------------------------------------------------------
listaTickets.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target; // el formulario de comentario donde se hizo "submit"
  const id = form.closest(".ticket-item").dataset.id;
  ocultarMensaje();

  const datos = {
    autor: form.elements.autor.value,
    texto: form.elements.texto.value,
  };

  try {
    await api(`/api/tickets/${id}/comentarios`, { method: "POST", body: JSON.stringify(datos) });
    await cargarTodo();
    mostrarMensaje("Comentario agregado.", "ok");
  } catch (err) {
    mostrarMensaje(err.message, "error");
  }
});

// Al abrir la página, cargamos todo
cargarTodo();