# Astralis

Aplicación astrológica web con un motor de cálculo independiente de la interfaz.

## Espacios de trabajo

- `apps/web`: cliente React y SVG para la carta.
- `apps/api`: futura API para cartas, informes y usuarios.
- `apps/ephemeris-service`: frontera del cálculo de efemérides.
- `packages/astro-domain`: tipos y modelos estables.
- `packages/astro-engine`: coordinación de cálculos mediante un proveedor intercambiable.
- `packages/astro-rules`: aspectos y orbes configurables.
- `packages/astro-renderer`: representación SVG independiente de React.
- `packages/shared`: utilidades sin dependencia de dominio.

## Inicio

```bash
npm install
npm run dev
```

La web se sirve en `http://localhost:5173`. Para comprobar todo el monorepo:

```bash
npm run check
npm run test
npm run build
```

La API se inicia con `npm --workspace @astralis/api run dev` y expone `POST /v1/natal-charts` en `http://localhost:3001`. El cuerpo esperado es:

```json
{
  "birthData": {
    "date": "1990-08-16",
    "time": "12:00:00",
    "timeZone": "Europe/Madrid",
    "latitude": 40.4168,
    "longitude": -3.7038
  },
  "houseSystem": "placidus"
}
```

## Siguientes decisiones

`apps/ephemeris-service` incluye `SwissEphemerisProvider`, basado en `@swisseph/node`. Calcula posiciones tropicales geocéntricas con velocidad y las casas disponibles en el dominio. Las efemérides se incluyen con el paquete y se ejecutan únicamente en Node.js; no se importan en la aplicación web.

## Licencia

Astralis se distribuye bajo la **GNU Affero General Public License v3.0 o posterior (AGPL-3.0-or-later)**. Consulta [LICENSE](./LICENSE) para el aviso de licencia y el enlace al texto oficial completo.

Al integrar Swiss Ephemeris se conservarán sus avisos de copyright y licencia. Su distribución bajo AGPL requiere que el proyecto completo se publique bajo AGPL o una licencia compatible.
