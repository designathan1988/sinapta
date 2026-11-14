// Zooming and moving a map view (ADR-0013): the camera is the interface's,
// kept for the one map moved last. Each change starts from that camera,
// or from the frame the view showed when it had none.
import {
  defineCommand,
  type AppState,
  type MapCamera,
} from "../../../../state/index.ts";

const MAX_ZOOM = 18;

function cameraOf(state: AppState, from: MapCamera): MapCamera {
  const camera = state.ui.mapCamera;
  return camera?.viewId === from.viewId ? camera : from;
}

function withCamera(state: AppState, camera: MapCamera) {
  return { ui: { ...state.ui, mapCamera: camera } };
}

// Moves the map by a number of its drawn pixels, as a drag does.
export const panMap = defineCommand<{
  from: MapCamera;
  dx: number;
  dy: number;
}>({
  type: "map.pan",
  handle: (state, { from, dx, dy }) => {
    const camera = cameraOf(state, from);
    return withCamera(state, {
      ...camera,
      centerX: camera.centerX - dx,
      centerY: camera.centerY - dy,
    });
  },
});

// Zooms in (by 1) or out (by -1) about the map's centre.
export const zoomMap = defineCommand<{ from: MapCamera; by: number }>({
  type: "map.zoom",
  handle: (state, { from, by }) => {
    const camera = cameraOf(state, from);
    const zoom = Math.min(MAX_ZOOM, Math.max(0, camera.zoom + by));
    const scale = 2 ** (zoom - camera.zoom);
    return withCamera(state, {
      viewId: camera.viewId,
      zoom,
      centerX: camera.centerX * scale,
      centerY: camera.centerY * scale,
    });
  },
});

export const mapCommands = [panMap, zoomMap];
