export type RedingtonCategoryTreeNode = {
  id: number
  parent_id: number | null
  name: string
  is_active: boolean
  position: number
  level: number
  product_count: number
  children_data: RedingtonCategoryTreeNode[]
}

type CategoryRow = {
  id: number
  parent_id: number | null
  name: string
  is_active: boolean
  position: number
  level: number
  product_count: number
}

type QueryableManager = {
  query: (sql: string, parameters?: any[]) => Promise<CategoryRow[]>
}

const sortNodes = (nodes: RedingtonCategoryTreeNode[]) => {
  nodes.sort((a, b) => {
    if (a.position !== b.position) {
      return a.position - b.position
    }
    return a.id - b.id
  })
  nodes.forEach((node) => sortNodes(node.children_data))
}

export const buildCategoryTree = (
  categories: CategoryRow[]
): RedingtonCategoryTreeNode[] => {
  const nodes = categories.map<RedingtonCategoryTreeNode>((category) => ({
    id: category.id,
    parent_id: category.parent_id ?? null,
    name: category.name,
    is_active: Boolean(category.is_active),
    position: category.position ?? 0,
    level: category.level ?? 0,
    product_count: category.product_count ?? 0,
    children_data: [],
  }))

  const lookup = new Map<number, RedingtonCategoryTreeNode>()
  nodes.forEach((node) => lookup.set(node.id, node))

  const roots: RedingtonCategoryTreeNode[] = []
  nodes.forEach((node) => {
    if (node.parent_id !== null) {
      const parent = lookup.get(node.parent_id)
      if (parent) {
        parent.children_data.push(node)
        return
      }
    }
    roots.push(node)
  })

  sortNodes(roots)
  return roots
}

export const loadCategoryTree = async (
  manager: QueryableManager
): Promise<RedingtonCategoryTreeNode[]> => {
  const categories = await manager.query(
    `SELECT id,
            parent_id,
            name,
            is_active,
            position,
            level,
            product_count
       FROM redington_category
       ORDER BY level ASC, position ASC, id ASC`
  )
  return buildCategoryTree(categories)
}
