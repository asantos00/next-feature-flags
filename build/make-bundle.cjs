const { promisify } = require("util")
const fs = require("fs")
const path = require("path")
const rollup = require("rollup")
const readFile = promisify(fs.readFile)
const srcPath = path.join(__dirname, "..", "src")
const compiledPath = path.join(__dirname, "compiled")
async function build() {
  let bundle = await rollup.rollup({
    input: path.join(compiledPath, "index.js")
  })
  let { code } = await bundle.generate({
    format: "cjs",
    sourcemap: false, 
  })
}
async function makeDefinitionsCode() {
  let defs = [
    "// -- Usage definitions --",
    removeLocalImportsExports((await readFile(path.join(srcPath, "exported-definitions.d.ts"), "utf-8")).trim()),
    "// -- Driver definitions --",
    removeLocalImportsExports((await readFile(path.join(srcPath, "driver-definitions.d.ts"), "utf-8")).trim()),
    "// -- Entry point definition --",
    removeSemicolons(
      removeLocalImportsExports((await readFile(path.join(compiledPath, "index.d.ts"), "utf-8")).trim()),
    )
  ]
  return defs.join("\n\n")
}
function removeLocalImportsExports(code) {
  let localImportExport = /^\s*(import|export) .* from "\.\/.*"\s*;?\s*$/
  return code.split("\n").filter(line => {
    return !localImportExport.test(line)
  }).join("\n").trim()
}
function removeSemicolons(code) {
  return code.replace(/;/g, "")
}
build().then(() => {
  console.log("done")
}, err => console.log(err.message, err.stack))