# 🤝 Guía de Contribución para LiveMark Studio

¡Gracias por tu interés en contribuir a LiveMark Studio! 🎉 Este documento proporciona pautas y pasos para colaborar en el proyecto.

## 📑 Tabla de Contenidos

- [📜 Código de Conducta](#código-de-conducta)
- [🚀 ¿Cómo puedo contribuir?](#cómo-puedo-contribuir)
  - [🐛 Reportar Bugs](#reportar-bugs)
  - [💡 Sugerir Funcionalidades](#sugerir-funcionalidades)
  - [🛠️ Tu Primer Pull Request](#tu-primer-pull-request)
- [🎨 Guías de Estilo](#guías-de-estilo)
- [💻 Comandos del Proyecto](#comandos-del-proyecto)

---

## 📜 Código de Conducta

Este proyecto y todos los que participan en él se rigen por el **Código de Conducta**. Al participar, se espera que defiendas este código. Por favor, reporta cualquier comportamiento inaceptable para mantener un ambiente seguro y acogedor para todos. 🛡️

## 🚀 ¿Cómo puedo contribuir?

### 🐛 Reportar Bugs

Si encuentras un error, por favor crea un *issue* detallando:

1.  👣 **Pasos para reproducir el error.**
2.  🤔 **Comportamiento esperado vs. comportamiento real.**
3.  📸 **Capturas de pantalla** (si aplica).
4.  🖥️ **Entorno** (Navegador, SO, versión).

### 💡 Sugerir Funcionalidades

Las sugerencias de mejoras son bienvenidas. Por favor abre un *issue* con la etiqueta `enhancement` o `feature request` y describe:

* El problema que resuelve tu sugerencia.
* Una descripción detallada de la solución propuesta.

### 🛠️ Tu Primer Pull Request

1.  🍴 Haz un **Fork** del repositorio.
2.  📥 Clona tu fork localmente:
    ```bash
    git clone [https://github.com/tu-usuario/LiveMark-Studio.git](https://github.com/tu-usuario/LiveMark-Studio.git)
    ```
3.  🌿 Crea una nueva rama para tu funcionalidad o corrección:
    ```bash
    git checkout -b mi-nueva-funcionalidad
    ```
4.  💾 Realiza tus cambios y haz commit:
    ```bash
    git commit -m "feat: agrega nueva funcionalidad increíble"
    ```
    > 📝 *Nota: Recomendamos usar [Conventional Commits](https://www.conventionalcommits.org/).*
5.  ⬆️ Haz push a tu rama:
    ```bash
    git push origin mi-nueva-funcionalidad
    ```
6.  🔀 Abre un **Pull Request** en el repositorio original.

## 🎨 Guías de Estilo

* **⚛️ JavaScript/React**: Seguimos las reglas configuradas en ESLint. Asegúrate de que tu código pase el linter antes de enviar un PR.
* **💅 CSS**: Utilizamos **Tailwind CSS**. Intenta usar las clases de utilidad siempre que sea posible en lugar de CSS personalizado.
* **📂 Estructura**: Mantén los componentes en `src/components` y la lógica reutilizable en hooks o utilidades.

 ## 💻 Comandos del Proyecto


Asegúrate de tener instaladas las dependencias:


```bash
npm install
```


### ▶️ Desarrollo


Para iniciar el servidor de desarrollo:


```bash
npm run dev
```


### 🔍 Linting


Para verificar problemas de estilo y errores en el código:


```bash
npm run lint
```


### 🏗️ Construcción


Para generar la versión de producción:


```bash
npm run build
```


---


¡Gracias por contribuir a hacer LiveMark Studio mejor! ❤️