// Apertura de marca: se ve apenas se abre el link, mientras descarga la app.
// Dura lo que tarda la carga real (app + fuentes), con un mínimo breve para que
// no parpadee y un tope para no dejar a nadie esperando. Una vez por sesión.
// Archivo aparte (no <script> en línea) para que funcione con una CSP estricta.
;(function () {
  var root = document.documentElement
  var seen = false
  try {
    seen = sessionStorage.getItem('ft-intro') === '1'
  } catch {
    // Sin sessionStorage (modo privado estricto): se muestra la apertura igual
  }
  // Las visitas siguientes de la sesión y el panel admin no muestran la apertura
  if (seen || location.pathname.indexOf('/admin') === 0) root.classList.add('ft-skip')

  // Fuentes sin bloquear el primer render ni el arranque de la app. Una hoja de estilos
  // en el <head> frena el render y los módulos esperan a que termine de cargar: con red
  // lenta la app tardaba segundos en montar. Agregada desde aquí no bloquea nada.
  // (Sin onload en el HTML: la CSP no permite manejadores en línea.)
  var fontsCss = document.createElement('link')
  fontsCss.rel = 'stylesheet'
  fontsCss.href =
    'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=Manrope:wght@400..800&display=swap'
  var fontsCssDone = new Promise(function (resolve) {
    fontsCss.onload = fontsCss.onerror = resolve
  })
  document.head.appendChild(fontsCss)

  var done = false

  // Avisa a la portada que puede arrancar su animación
  function start() {
    window.__ftIntro = true
    window.dispatchEvent(new Event('ft:intro'))
  }

  function exit() {
    if (done) return
    done = true
    try {
      sessionStorage.setItem('ft-intro', '1')
    } catch {
      // Sin sessionStorage: la próxima visita la vuelve a mostrar, nada más
    }
    root.classList.add('ft-done') // devuelve el scroll (ver boot.css)
    var curtain = document.getElementById('ft-curtain')
    if (!curtain || root.classList.contains('ft-skip')) {
      if (curtain) curtain.remove()
      start()
      return
    }
    curtain.classList.add('out')
    setTimeout(start, 120) // la portada arranca mientras sube la cortina
    setTimeout(function () {
      curtain.remove()
    }, 800)
  }

  // La app llama a esto cuando terminó de montar (ver src/main.tsx)
  window.__ftAppReady = function () {
    var skip = root.classList.contains('ft-skip')
    // Primero la hoja de fuentes (sin ella document.fonts.ready ya está resuelto), luego las fuentes
    var fonts = fontsCssDone.then(function () {
      return document.fonts ? document.fonts.ready : undefined
    })
    var cap = new Promise(function (resolve) {
      setTimeout(resolve, skip ? 500 : 2500)
    })
    Promise.race([fonts, cap]).then(function () {
      // performance.now() cuenta desde que se abrió el link: con red lenta no se suma espera
      setTimeout(exit, skip ? 0 : Math.max(0, 1000 - performance.now()))
    })
  }

  // Tocar la pantalla salta la apertura
  document.addEventListener('click', function (event) {
    var target = event.target
    if (target && target.closest && target.closest('#ft-curtain')) exit()
  })

  // La app no llegó a montar (el paquete no cargó o falló al arrancar): se levanta la cortina
  // y, si #root sigue vacío, queda un mensaje con botón para reintentar. Si la app monta más
  // tarde (red muy lenta), React reemplaza el contenido de #root y el mensaje desaparece.
  function showFail() {
    exit()
    var mount = document.getElementById('root')
    if (!mount || mount.firstChild) return
    var box = document.createElement('div')
    box.className = 'ft-fail'
    box.setAttribute('role', 'alert')
    var text = document.createElement('p')
    text.textContent = 'La tienda no terminó de cargar. Revisa tu conexión y vuelve a intentarlo.'
    var retry = document.createElement('button')
    retry.type = 'button'
    retry.textContent = 'Reintentar'
    retry.addEventListener('click', function () {
      location.reload()
    })
    box.appendChild(text)
    box.appendChild(retry)
    mount.appendChild(box)
  }

  // Si el archivo de la app falla (404, sin red, bloqueado) no hace falta esperar al tope de tiempo.
  // Los errores de carga no burbujean: se escuchan en la fase de captura.
  window.addEventListener(
    'error',
    function (event) {
      var el = event.target
      if (el && el.tagName === 'SCRIPT' && el.type === 'module') showFail()
    },
    true,
  )

  // Tope de espera: no dejar a nadie atrapado detrás de la cortina ni frente a una página vacía.
  // Si ni siquiera corre este archivo, boot.css levanta cortina y bloqueo de scroll por su cuenta.
  setTimeout(showFail, 8000)
})()
