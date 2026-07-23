// swift-tools-version:5.9
// The optional macOS accessibility helper for Cursor Distorter.
//
// This is a minimal, documented executable scaffold. It is OPTIONAL and NOT built as
// part of the normal app build. Build it explicitly with `swift build` from this
// directory. See README.md for purpose, safety boundaries, and how it fits in.

import PackageDescription

let package = Package(
    name: "cursor-distorter-helper",
    platforms: [
        .macOS(.v13)
    ],
    targets: [
        .executableTarget(
            name: "cursor-distorter-helper",
            path: "Sources/CursorDistorterHelper"
        )
    ]
)
