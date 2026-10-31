import { expect, test } from "bun:test"
import pkg from "../package.json"

test("react, react-dom and lucide-react are devDependencies, not runtime dependencies", () => {
  expect(pkg.dependencies).not.toHaveProperty("react")
  expect(pkg.dependencies).not.toHaveProperty("react-dom")
  expect(pkg.dependencies).not.toHaveProperty("lucide-react")

  expect(pkg.devDependencies).toHaveProperty("react")
  expect(pkg.devDependencies).toHaveProperty("react-dom")
  expect(pkg.devDependencies).toHaveProperty("lucide-react")
})
