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
    var fonts = document.fonts ? document.fonts.ready : Promise.resolve()
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

  // Si la app no llegara a cargar, no dejar a nadie atrapado detrás de la cortina
  setTimeout(exit, 8000)
})()
