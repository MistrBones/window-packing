
# WindowPacker

WindowPacker is a hybrid between a packing and a covering algorithm with special considerations for images. WindowPacker is designed with a focus on finding good enough solutions quickly - the Javascript implementation finds solutions for 500 objects in ~100ms in the worst case. For a more typical use case the algorithm runs in ~3ms for up to 50 objects. 

This repo contains an index file with a simple js playground intended for prototyping the algorithm, a copy of the algorithm with bindings allowing it to be used as a CLI tool via Node, and a sample shell script for using the algorithm for window management on hyprland. 

Currently I've opted to handle command generation for CLI usage on the Javascript side instead of on the shell script side because I find JS easier to write. This is accomplished by writing adapter code that runs at the start of and at the end of program execution. For the moment the adapter code is included directly inside the packing.js file but it will eventually have it's own home to make the program more cleanly extensible.


## Demo


https://github.com/user-attachments/assets/7b6b472d-3773-4d30-b6a6-1c2c053e6b76



## License

[Apache v2](https://www.apache.org/licenses/LICENSE-2.0)


## Roadmap

- Move adapter code to a dedicated location

- Fix window gap support

- Additional configuration options to request minimum object sizes + allow aspect ratio changes for specific objects

- JS library for creating nice image collages

