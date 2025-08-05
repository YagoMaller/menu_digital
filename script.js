/**
 * ============================
 * Constants and Global Variables
 * ============================
 */
const localesDiv = document.querySelector(".locales");
const categoriasDiv = document.querySelector(".categorias");
const subcategoriasDiv = document.querySelector(".subcategorias");
const menuContainer = document.getElementById("menu");

const backgroundImages = {
  "Pancho": "imgPancho.jpg",
  "Bar": "imgBar.jpg",
  "Chopchop"  : "imgChopchop.jpg",
  "Panchos": "imgPanchos.jpg",
  "Chopchop-Comidas": "imgComidas.jpg",
  "Chopchop-Bebidas": "imgBebidas.jpg",
  "Chopchop-Tragos": "imgBarsub.jpg",
  "Chopchop-Cafetería": "imgCafe.jpg",
  "Chopchop-Pastelería": "imgPastel.jpg",
  
};

let currentLocal = null;
let currentCategoria = null;
let blockInitialScroll = true;
let isScrollingByClick = false;
let isCenteringButton = false;
let scrollTimeout = null;
let observerTimeout = null;
let scrollTriggeredByObserver = false;
let isUserDragging = false;

/**
 * ============================
 * Utility Functions
 * ============================
 */


/**
 * Verifica si el contenido de texto de un elemento se desborda horizontalmente.
 * @param {HTMLElement} element - Elemento HTML a evaluar.
 * @returns {boolean} - `true` si el texto se desborda, `false` si no.
 */
function isTextOverflowing(element) {
  if (!element) return false;
  return element.scrollWidth > element.clientWidth;
}

/**
 * Crea los indicadores de posición para un carrusel.
 * @param {HTMLElement} container - Contenedor del carrusel (.categorias o .subcategorias)
 */
function generarIndicadores(container) {
  let indicadorContainer = container.nextElementSibling;
  if (!indicadorContainer || !indicadorContainer.classList.contains("indicadores-carrusel")) {
    indicadorContainer = document.createElement("div");
    indicadorContainer.classList.add("indicadores-carrusel");
    container.parentNode.insertBefore(indicadorContainer, container.nextSibling);
  } else {
    indicadorContainer.innerHTML = ""; // Limpiar si ya existe
  }

  const botones = Array.from(container.querySelectorAll("button"));
  botones.forEach((_, i) => {
    const punto = document.createElement("div");
    punto.classList.add("indicador");
    if (i === 0) punto.classList.add("activo");
    indicadorContainer.appendChild(punto);
  });
}
/**
 * Realiza un scroll suave hacia el elemento recibido como parámetro,
 * ajustando la posición según la altura del header.
 * @param {HTMLElement} element - Elemento al que se debe hacer scroll.
 */
function scrollToWithOffset(element) {
  if (blockInitialScroll) return;
  const headerOffset = document.querySelector(".navegacion").offsetHeight;
  const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
  const offsetPosition = elementPosition - headerOffset - 10;
        console.log("Scroll to :", element);
  window.scrollTo({
    top: offsetPosition,
    behavior: "smooth",
  });
}

/**
 * Remueve la clase 'active' de todos los botones dentro del contenedor especificado.
 * @param {HTMLElement} container - Contenedor de botones.
 */
function clearActiveButtons(container) {
  container.querySelectorAll("button").forEach((btn) => btn.classList.remove("active"));
}


/**
 * Agrega la clase 'active' al botón cuyo texto coincida con el parámetro
 * y lo centra horizontalmente en su contenedor si aplica.
 * @param {HTMLElement} container - Contenedor de botones.
 * @param {string} text - Texto del botón a resaltar.
 */
function highlightButton(container, text) {
  clearActiveButtons(container);
  const btns = Array.from(container.querySelectorAll("button"));
  const btn = btns.find((b) => b.textContent === text);
  if (btn) {
    btn.classList.add("active");
    scrollToCenterButton(container, text);

    // 🔄 Actualizar indicadores correspondientes
    const index = btns.indexOf(btn);
    const indicadorContainer = container.nextElementSibling;
    if (indicadorContainer && indicadorContainer.classList.contains("indicadores-carrusel")) {
      const puntos = indicadorContainer.querySelectorAll(".indicador");
      puntos.forEach(p => p.classList.remove("activo"));
      if (puntos[index]) puntos[index].classList.add("activo");
    }
  }
}

/**
 * Centra horizontalmente un botón dentro de su contenedor scrollable si no lo está ya.
 * @param {HTMLElement} container - Contenedor del scroll (e.g. .subcategorias)
 * @param {string} text - Texto del botón a centrar
 */
function scrollToCenterButton(container, text) {
  const btn = Array.from(container.querySelectorAll("button")).find((b) => b.textContent === text);
  if (!btn) return;

  const containerRect = container.getBoundingClientRect();
  const btnRect = btn.getBoundingClientRect();

  const containerCenter = containerRect.left + containerRect.width / 2;
  const btnCenter = btnRect.left + btnRect.width / 2;

  const distance = btnCenter - containerCenter;

  if (Math.abs(distance) >  1 ) {
    isCenteringButton = true;
    container.scrollBy({ left: distance, behavior: "smooth" });
    setTimeout(() => {
      isCenteringButton = false;
    }, 100);
  }
}

/**
 * Determina el botón más cercano al centro de un contenedor.
 * @param {HTMLElement} container - Contenedor del scroll.
 * @returns {HTMLElement|null} - Botón centrado o más cercano.
 */
function getCenteredButton(container) {
  const containerRect = container.getBoundingClientRect();
  const centerX = containerRect.left + containerRect.width / 2;

  let closestBtn = null;
  let closestDistance = Infinity;

  container.querySelectorAll("button").forEach((btn) => {
    const rect = btn.getBoundingClientRect();
    const btnCenter = rect.left + rect.width / 2;
    const distance = Math.abs(btnCenter - centerX);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestBtn = btn;
    }
  });

  return closestBtn;
}

/**
 * Activa o desactiva el scroll horizontal en un contenedor según el contenido real.
 * @param {HTMLElement} container - Ej: .subcategorias o .categorias
 */
function toggleCarouselIfNeeded(container) {
  const totalWidth = Array.from(container.children).reduce((acc, child) => acc + child.offsetWidth, 0);
  const visibleWidth = container.offsetWidth;

  if (totalWidth > visibleWidth + 5) {
    container.classList.add("es-carousel");
  } else {
    container.classList.remove("es-carousel");
  }
}

/**
 * Habilita el comportamiento de snap para un contenedor tipo carrusel.
 * @param {HTMLElement} container - Contenedor del carrusel.
 */
function enableCarouselSnap(container) {
  let scrollTimeout = null;
  if (!container.classList.contains("es-carousel")) return;
// Marcar cuando el usuario hace click/touch sobre el carrusel
  container.addEventListener("pointerdown", () => {
  isUserDragging = true;
});
// Marcar también uso de la rueda del mouse
container.addEventListener("wheel", () => {
  isUserDragging = true;
});
  container.addEventListener("scroll", () => {
    if (scrollTimeout) clearTimeout(scrollTimeout);

    scrollTimeout = setTimeout(() => {
      if (!isUserDragging || isScrollingByClick || isCenteringButton){
              isUserDragging = false;
        return; // 🔐 protección adicional
      }

      const centeredBtn = getCenteredButton(container);
      if (centeredBtn) {
        const text = centeredBtn.textContent;

        highlightButton(container, text);

        if (container === subcategoriasDiv) {
          const target = document.querySelector(
            `[data-subcategoria='${text}'][data-categoria='${currentCategoria}'][data-local='${currentLocal}']`
          );
          if (target && !scrollTriggeredByObserver && !blockInitialScroll) {
            isScrollingByClick = true;
                    console.log("Scroll by enablecarrusel", target);
            scrollToWithOffset(target);
          }
        }

        if (container === categoriasDiv && currentLocal) {

          console.log("Renderizando de enablecarousel para");

          const target = document.querySelector(
            `[data-categoria='${text}'][data-local='${currentLocal}']`
          );
          if (target && !scrollTriggeredByObserver  && !blockInitialScroll) {
            isScrollingByClick = true;
            console.log("Scroll by enablecarrusel2:", target);
            renderSubcategorias(currentLocal, target.getAttribute("data-categoria"), true);
            scrollToWithOffset(target); 
          }
        }
      }
      isUserDragging = false;
    }, 100);
    
  });
}

/**
 * ============================
 * Rendering Functions
 * ============================
 */

/**
 * Cambia el fondo del header según la imagen especificada.
 * @param {string} imagePath - Ruta de la imagen de fondo.
 */
function setNavegacionBackground(imagePath) {
  const header = document.querySelector(".navegacion");
  header.style.backgroundImage = imagePath ? `url('${imagePath}')` : "none";
}

/**
 * Renderiza los botones de subcategorías y vincula su comportamiento al scroll.
 * @param {string} local - Nombre del local actual.
 * @param {string} cat - Categoría seleccionada.
 */
function renderSubcategorias(local, cat, evitarScroll = false) {
  subcategoriasDiv.innerHTML = "";
  highlightButton(categoriasDiv, cat);
  currentCategoria = cat;

  const subcats = menuData[local][cat];
  for (const sub in subcats) {
    const subBtn = document.createElement("button");
    subBtn.textContent = sub;
    subBtn.onclick = () => {
      highlightButton(subcategoriasDiv, sub);
      const target = document.querySelector(
        `[data-subcategoria='${sub}'][data-categoria='${cat}'][data-local='${local}']`
      );
      if (target) {
        isScrollingByClick = true;
        console.log("Scroll by rendersubcategorias:", target);
        scrollToWithOffset(target);

      }
    };
    subcategoriasDiv.appendChild(subBtn);
  }

  toggleCarouselIfNeeded(subcategoriasDiv);
  generarIndicadores(subcategoriasDiv);
  const firstSub = subcategoriasDiv.querySelector("button");
  if (firstSub) {
    highlightButton(subcategoriasDiv, firstSub.textContent);
    if (!evitarScroll) {
      requestAnimationFrame(() => {
        scrollToCenterButton(subcategoriasDiv, firstSub.textContent);
      });
    }
  }
}

/**
 * Renderiza los botones de categorías para el local especificado
 * y activa la categoría inicial.
 * @param {string} local - Nombre del local seleccionado.
 */
function renderCategorias(local, evitarScroll = false) {
  categoriasDiv.innerHTML = "";
  subcategoriasDiv.innerHTML = "";
  currentLocal = local;


  /**
  if (backgroundImages[local]) {
    setNavegacionBackground(backgroundImages[local]);
  }
  */

  const categorias = menuData[local];
  let firstCat = true;
  let firstCatText = null;

  for (const cat in categorias) {
    const catBtn = document.createElement("button");
    catBtn.textContent = cat;
    catBtn.onclick = () => {
      renderSubcategorias(local, cat);
      scrollToCenterButton(categoriasDiv, cat);

      const target = document.querySelector(
        `h3.titulo-con-fondo[data-categoria='${cat}'][data-local='${local}']`
      );
      if (target) {
        isScrollingByClick = true;
                console.log("Scroll by rendercategorias:", target);
        scrollToWithOffset(target);
      }
    };
    categoriasDiv.appendChild(catBtn);

    if (firstCat) {
      if (currentCategoria !== cat || currentLocal !== local) {
          console.log("Renderizando de rendercategorias");
        renderSubcategorias(local, cat, evitarScroll);
      }
      highlightButton(categoriasDiv, cat);

      currentCategoria = cat;
      firstCatText = cat;
      firstCat = false;

    
      if (!evitarScroll) {
        requestAnimationFrame(() => {
          scrollToCenterButton(categoriasDiv, cat);
          const firstSub = subcategoriasDiv.querySelector("button");
          if (firstSub) {
            scrollToCenterButton(subcategoriasDiv, firstSub.textContent);
          }
        });
      }
    }
  }

  toggleCarouselIfNeeded(categoriasDiv);
  generarIndicadores(categoriasDiv);
  scrollToCenterButton(categoriasDiv, firstCatText);
}

/**
 * Renderiza los botones de locales y su comportamiento asociado.
 * Si hay solo un local, no se muestra la barra de navegación de locales.
 */
function renderNavegacion() {
  const locales = Object.keys(menuData);

  if (locales.length <= 1) {
    // Oculta la barra de locales si hay solo uno
    localesDiv.style.display = "none";

    // Renderiza igual la categoría de ese local
    const local = locales[0];
    renderCategorias(local, true);
    highlightButton(localesDiv, local);
    currentLocal = local;
  } else {
    // Mostrar locales
    localesDiv.style.display = "flex";
    let firstLocal = true;

    for (const local of locales) {
      const localBtn = document.createElement("button");
      localBtn.textContent = local;
      localBtn.onclick = () => {
        renderCategorias(local);
        const section = document.querySelector(`[data-local='${local}']`);
        if (section) {
          isScrollingByClick = true;
                  console.log("Scroll by renderNavegacion:", target);
          scrollToWithOffset(section);
        }
      };
      localesDiv.appendChild(localBtn);
      if (firstLocal) {
        renderCategorias(local, true);
        highlightButton(localesDiv, local);
        currentLocal = local;
        firstLocal = false;
      }
    }
  }

  setTimeout(() => {
    blockInitialScroll = false;
  }, 1000);
}
/**
 * Renderiza todas las secciones del menú según los datos cargados.
 */
function renderSecciones() {
  let isFirst = true;
  for (const local in menuData) {
    const sectionLocal = document.createElement("section");
    if (isFirst) {
      const introContainer = document.getElementById("intro-local-container");
      const introH2 = document.createElement("h2");
      introH2.classList.add("titulo-con-fondo", "sin-texto", "sin-oscurecer");
      introH2.setAttribute("data-local", local);
      if (backgroundImages[local]) {
        introH2.style.backgroundImage = `url('${backgroundImages[local]}')`;
      }
      introH2.innerHTML = ``; // Sin texto
      introContainer.appendChild(introH2);
    }
    sectionLocal.setAttribute("data-local", local);

    const h2 = document.createElement("h2");
    h2.classList.add("titulo-con-fondo");
    h2.setAttribute("data-local", local);
    if (backgroundImages[local]) {
      h2.style.backgroundImage = `url('${backgroundImages[local]}')`;
    }
    h2.innerHTML = `<span>${local}</span>`;
    if (!isFirst) {
      sectionLocal.appendChild(h2);
    }
    isFirst = false;

    for (const categoria in menuData[local]) {
      const sectionCat = document.createElement("section");
      sectionCat.setAttribute("data-categoria", categoria);
      sectionCat.setAttribute("data-local", local);

      const h3 = document.createElement("h3");
      h3.classList.add("titulo-con-fondo");
      h3.setAttribute("data-categoria", categoria);
      h3.setAttribute("data-local", local);
      const catKey = `${local}-${categoria}`;
      if (backgroundImages[catKey]) {
        h3.style.backgroundImage = `url('${backgroundImages[catKey]}')`;
      }
      h3.innerHTML = `<span>${categoria}</span>`;
      sectionCat.appendChild(h3);

      for (const subcategoria in menuData[local][categoria]) {
        const productos = menuData[local][categoria][subcategoria];

        const sectionSub = document.createElement("section");
        sectionSub.setAttribute("data-subcategoria", subcategoria);
        sectionSub.dataset.local = local;
        sectionSub.dataset.categoria = categoria;
        sectionSub.classList.add("subcategoria-block");
        
        const key = `${local}-${categoria}-${subcategoria}`;
        if (backgroundImages[key]) {
          const h4 = document.createElement("h4");
          h4.classList.add("titulo-con-fondo");
          h4.style.backgroundImage = `url('${backgroundImages[key]}')`;
          h4.innerHTML = `<span>${subcategoria}</span>`;
          sectionSub.appendChild(h4);
        } else {
          sectionSub.innerHTML = `<h4>${subcategoria}</h4>`;
        }

        productos.forEach((p) => {
          if (!p.precio) return;
          sectionSub.innerHTML += `
            <div class="producto">
              <div class="descripcion">
                <p class="nombre">${p.nombre}</p>
                <p class="detalle">${p.detalle}</p>
              </div>
              <div class="precio">$${p.precio}</div>
            </div>
          `;
          
        });

        sectionCat.appendChild(sectionSub);
      }

      sectionLocal.appendChild(sectionCat);
    }

    menuContainer.appendChild(sectionLocal);
  }
}

/**
 * Configura y gestiona la pantalla de carga inicial.
 * Muestra un fondo negro con el logo centrado y lo desvanece al cargar,
 * respetando un tiempo mínimo de visibilidad.
 */
function setupLoader() {
  const loader = document.getElementById("loader");
  if (!loader) return;

  const minDisplayTime = 900; // milisegundos: mínimo visible 1.5s
  const startTime = performance.now();

  window.addEventListener("load", () => {
    const elapsed = performance.now() - startTime;
    const remainingTime = Math.max(0, minDisplayTime - elapsed);

    setTimeout(() => {
      loader.classList.add("fade-out");

      setTimeout(() => {
        loader.style.display = "none";
      }, 800); // tiempo de transición CSS
    }, remainingTime);
  });
}

/**
 * Observa qué subcategoría está centrada en pantalla y sincroniza navegación.
 */
/**
 * Observa qué subcategoría está en el centro de pantalla
 * y sincroniza la navegación, incluso para secciones cortas.
 */
function setupIntersectionObserver() {
  const observer = new IntersectionObserver((entries) => {
    if (isScrollingByClick || blockInitialScroll) return;

    scrollTriggeredByObserver = true;

    const visibleEntries = entries
      .filter(e => e.isIntersecting)
      .map(e => ({
        entry: e,
        distanceToCenter: Math.abs(e.target.getBoundingClientRect().top + e.target.offsetHeight / 2 - window.innerHeight / 2),
      }))
      .sort((a, b) => a.distanceToCenter - b.distanceToCenter);

    if (visibleEntries.length === 0) return;

    const { entry } = visibleEntries[0];
    const target = entry.target;

    const sub = target.getAttribute("data-subcategoria");
    const cat = target.getAttribute("data-categoria");
    const loc = target.getAttribute("data-local");
    

    if (currentLocal !== loc) {
      renderCategorias(loc, true);
    }

    if (currentCategoria !== cat || subcategoriasDiv.childElementCount === 0) {
      currentCategoria = cat;
      highlightButton(categoriasDiv, cat);
      renderSubcategorias(loc, cat, true);
          console.log("Renderizando de intersection para:", cat);
    }

    highlightButton(subcategoriasDiv, sub);
    scrollToCenterButton(subcategoriasDiv, sub);

    clearTimeout(observerTimeout);
    observerTimeout = setTimeout(() => {
      scrollTriggeredByObserver = false;
    }, 300);
  }, {
    rootMargin: '-45% 0px -45% 0px',
    threshold: 0,
  });

  document.querySelectorAll(".subcategoria-block").forEach(sec => observer.observe(sec));
}
/**
 * Detecta cuándo el scroll fue realizado por el usuario manualmente
 * para evitar conflictos con el scroll automático.
 */
window.addEventListener("scroll", () => {
  if (scrollTimeout) clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    isScrollingByClick = false;
  }, 100);
});



/**
 * ============================
 * Initialization
 * ============================
 */

// Inicialización del menú interactivo
setupLoader(); 
renderNavegacion();
renderSecciones();
setTimeout(setupIntersectionObserver, 500);
enableCarouselSnap(categoriasDiv);
enableCarouselSnap(subcategoriasDiv);


document.querySelectorAll(".nombre").forEach(el => {
  if (isTextOverflowing(el)) {
    el.classList.add("desbordado");
  }
});

document.querySelectorAll(".detalle").forEach(el => {
  if (isTextOverflowing(el)) {
    el.classList.add("desbordado");
  }
});