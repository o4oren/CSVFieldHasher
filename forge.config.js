module.exports = {
    packagerConfig: {
        executableName: "NPIHasher",
        osxSign: {
            identity: process.env["APPLE_DEVELOPER_ACCOUNT"],
            hardenedRuntime: true,
            entitlements: "entitlements.plist",
            ["entitlements-inherit"]: "entitlements.plist",
            ["signature-flags"]: "library"
        },
        osxNotarize: {
            appleId: process.env["APPLE_ID"],
            appleIdPassword: process.env["APPLE_ID_PASSWORD"]
        },
    },
    makers: [
        {
            name: "@electron-forge/maker-squirrel",
            config: {
                name: "csvfieldhasher"
            }
        },
        {
            name: "@electron-forge/maker-zip",
            platforms: [
                "darwin"
            ]
        },
        {
            name: "@electron-forge/maker-deb",
            config: {}
        },
        {
            name: "@electron-forge/maker-rpm",
            config: {}
        }
    ],
    publishers: [
        {
            name: "@electron-forge/publisher-github",
            config: {
                repository: {
                    owner: "o4oren",
                    name: "CSVFieldHasher"
                }
            }
        }
    ],
    plugins: [
        [
            "@electron-forge/plugin-webpack",
            {
                mainConfig: "./webpack.main.config.js",
                renderer: {
                    config: "./webpack.renderer.config.js",
                    entryPoints: [
                        {
                            html: "./src/index.html",
                            js: "./src/renderer.js",
                            name: "main_window"
                        }
                    ]
                }
            }
        ]
    ]
};