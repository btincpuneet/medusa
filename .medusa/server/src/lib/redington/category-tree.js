"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadCategoryTree = exports.buildCategoryTree = void 0;
const sortNodes = (nodes) => {
    nodes.sort((a, b) => {
        if (a.position !== b.position) {
            return a.position - b.position;
        }
        return a.id - b.id;
    });
    nodes.forEach((node) => sortNodes(node.children_data));
};
const buildCategoryTree = (categories) => {
    const nodes = categories.map((category) => ({
        id: category.id,
        parent_id: category.parent_id ?? null,
        name: category.name,
        is_active: Boolean(category.is_active),
        position: category.position ?? 0,
        level: category.level ?? 0,
        product_count: category.product_count ?? 0,
        children_data: [],
    }));
    const lookup = new Map();
    nodes.forEach((node) => lookup.set(node.id, node));
    const roots = [];
    nodes.forEach((node) => {
        if (node.parent_id !== null) {
            const parent = lookup.get(node.parent_id);
            if (parent) {
                parent.children_data.push(node);
                return;
            }
        }
        roots.push(node);
    });
    sortNodes(roots);
    return roots;
};
exports.buildCategoryTree = buildCategoryTree;
const loadCategoryTree = async (manager) => {
    const categories = await manager.query(`SELECT id,
            parent_id,
            name,
            is_active,
            position,
            level,
            product_count
       FROM redington_category
       ORDER BY level ASC, position ASC, id ASC`);
    return (0, exports.buildCategoryTree)(categories);
};
exports.loadCategoryTree = loadCategoryTree;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2F0ZWdvcnktdHJlZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9saWIvcmVkaW5ndG9uL2NhdGVnb3J5LXRyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBeUJBLE1BQU0sU0FBUyxHQUFHLENBQUMsS0FBa0MsRUFBRSxFQUFFO0lBQ3ZELEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDbEIsSUFBSSxDQUFDLENBQUMsUUFBUSxLQUFLLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUM5QixPQUFPLENBQUMsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQTtRQUNoQyxDQUFDO1FBQ0QsT0FBTyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUE7SUFDcEIsQ0FBQyxDQUFDLENBQUE7SUFDRixLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUE7QUFDeEQsQ0FBQyxDQUFBO0FBRU0sTUFBTSxpQkFBaUIsR0FBRyxDQUMvQixVQUF5QixFQUNJLEVBQUU7SUFDL0IsTUFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBNEIsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDckUsRUFBRSxFQUFFLFFBQVEsQ0FBQyxFQUFFO1FBQ2YsU0FBUyxFQUFFLFFBQVEsQ0FBQyxTQUFTLElBQUksSUFBSTtRQUNyQyxJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUk7UUFDbkIsU0FBUyxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDO1FBQ3RDLFFBQVEsRUFBRSxRQUFRLENBQUMsUUFBUSxJQUFJLENBQUM7UUFDaEMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLLElBQUksQ0FBQztRQUMxQixhQUFhLEVBQUUsUUFBUSxDQUFDLGFBQWEsSUFBSSxDQUFDO1FBQzFDLGFBQWEsRUFBRSxFQUFFO0tBQ2xCLENBQUMsQ0FBQyxDQUFBO0lBRUgsTUFBTSxNQUFNLEdBQUcsSUFBSSxHQUFHLEVBQXFDLENBQUE7SUFDM0QsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUE7SUFFbEQsTUFBTSxLQUFLLEdBQWdDLEVBQUUsQ0FBQTtJQUM3QyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7UUFDckIsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLElBQUksRUFBRSxDQUFDO1lBQzVCLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFBO1lBQ3pDLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ1gsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7Z0JBQy9CLE9BQU07WUFDUixDQUFDO1FBQ0gsQ0FBQztRQUNELEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDbEIsQ0FBQyxDQUFDLENBQUE7SUFFRixTQUFTLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDaEIsT0FBTyxLQUFLLENBQUE7QUFDZCxDQUFDLENBQUE7QUEvQlksUUFBQSxpQkFBaUIscUJBK0I3QjtBQUVNLE1BQU0sZ0JBQWdCLEdBQUcsS0FBSyxFQUNuQyxPQUF5QixFQUNhLEVBQUU7SUFDeEMsTUFBTSxVQUFVLEdBQUcsTUFBTSxPQUFPLENBQUMsS0FBSyxDQUNwQzs7Ozs7Ozs7Z0RBUTRDLENBQzdDLENBQUE7SUFDRCxPQUFPLElBQUEseUJBQWlCLEVBQUMsVUFBVSxDQUFDLENBQUE7QUFDdEMsQ0FBQyxDQUFBO0FBZlksUUFBQSxnQkFBZ0Isb0JBZTVCIn0=