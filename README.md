
  

# WindowPacker

  

WindowPacker is a hybrid between a packing and a covering algorithm with special considerations for images. WindowPacker is designed with a focus on finding good enough solutions quickly - the Javascript implementation finds solutions for 500 objects in ~100ms in the worst case. For a more typical use case the algorithm runs in ~3ms for up to 50 objects.

  

This repo contains an index file with a simple js playground intended for prototyping the algorithm, a copy of the algorithm with bindings for usage with Node, and a sample shell script for using the algorithm for window management on hyprland.

  

Currently I've opted to handle command generation for CLI usage on the Javascript side instead of on the shell script side because I find JS easier to write. This is accomplished by writing adapter code that runs at the start of and at the end of program execution.

  
  

## Demo

https://github.com/user-attachments/assets/7b6b472d-3773-4d30-b6a6-1c2c053e6b76

  
  ## Usage
  The algorithm can be used by calling the `packing.js.` file via `node`
  
  The `packing.js` file does not have any inherently required arguments except for `--adapter` but in order to function it will need a `canvasWidth`, `canvasHeight`, and an array of `windows`objects (see below). Any arguments passed via the `Node` call will be passed to the requested adapter to keep any custom implementation logic separate from the algorithm. For example, in the `hyprland` adapter we pass a list of monitors, open windows, and the open workspace ID so that the script can identify the active workspace, which windows are open on that workspace, and additional x/y offsets to include for multiple monitor setups. See `scripts/hyprland.sh` for example usage.

In order to function the algorithm will require an array of `window` objects returned from the requested adapter. The array should be structured as such, any shown properties are required for the algorithm to function.
  ```
[
    [
        '0',
        {
            width: int,
            height: int
        }
    ],
    [
        '1',
        {
            width: int,
            height: int
        }
    ]
]
```
  Additional properties may be included for pre/post-processing in your adapter code. See `adapters/hyprland.js` for example implementation.

## License

  

[Apache v2](https://www.apache.org/licenses/LICENSE-2.0)

  
  

## Roadmap

  

- Additional configuration options to request minimum object sizes + allow aspect ratio changes for specific objects

  

- JS library for creating nice image collages
