/*
 * Catálogo de diagramas de arquitectura mostrados en /pages/arquitectura/.
 *
 * No hay build ni servidor de subida: el navegador no puede "listar" una
 * carpeta por sí solo, así que cada diagrama que copies en
 * /assets/img/arquitectura/ necesita una entrada aquí para aparecer.
 *
 * Campos de cada entrada:
 *   id          (obligatorio) identificador único, sin espacios ni acentos
 *               — se usa como ancla (#id) desde el sidebar.
 *   title       (obligatorio) título visible sobre el diagrama.
 *   description (obligatorio) texto breve que explica qué muestra.
 *   svg         (obligatorio) ruta al archivo .svg dentro de
 *               /assets/img/arquitectura/.
 *   source      (opcional) ruta al .txt con el código fuente del diagrama
 *               (Mermaid, draw.io, PlantUML...). Se ofrece como descarga de
 *               reserva; no se muestra ni se interpreta en la página.
 *
 * Ejemplo — copia este bloque, ajusta los valores y quita los comentarios:
 *
 * {
 *   id: 'red-servidores',
 *   title: 'Red de servidores',
 *   description: 'Interconexión entre los servidores de aplicación, base de datos y balanceadores.',
 *   svg: '/assets/img/arquitectura/red-servidores.svg',
 *   source: '/assets/img/arquitectura/red-servidores.txt',
 * },
 */
export const architectureDiagrams = [
  {
    id: 'modelo-completo',
    title: 'SaaS — Multi-Tenant',
    description: 'Vista completa del modelo de dominio multi-tenant: todas las entidades y sus relaciones en un solo diagrama.',
    svg: '/assets/img/arquitectura/DiagramaCompletoClaro.svg',
  },
  {
    id: 'organization',
    title: 'Organization',
    description: 'Modelo de clases de Organization (la corredora/tenant) y su estructura interna.',
    svg: '/assets/img/arquitectura/organizationClaros.svg',
  },
  {
    id: 'modelo-party',
    title: 'Identity User',
    description: 'Diagrama de clases del modelo Party: relación entre Identity, Customer, Executive y User.',
    svg: '/assets/img/arquitectura/IdentityCustomerExecutiveUser.svg',
  },
  {
    id: 'branding-organizacion',
    title: 'Branding by Organization',
    description: 'Modelo de clases de la personalización de marca (branding) por cada Organization.',
    svg: '/assets/img/arquitectura/BrandingByOrganizationClaro.svg',
  },
  {
    id: 'cobertura-productos',
    title: 'Product Coverage',
    description: 'Modelo de clases de productos de seguro y sus coberturas.',
    svg: '/assets/img/arquitectura/productCoverageClaro.svg',
  },
  {
    id: 'analitica',
    title: 'Reportería y Analítica',
    description: 'Arquitectura del módulo de reportería avanzada y analítica predictiva.',
    svg: '/assets/img/arquitectura/analitica.png',
  },
];
