/**
 * MagentoProductTab renders a dedicated admin tab that mirrors the default product detail layout,
 * but operates exclusively on the Magento payload stored in `product.metadata.magento`.
 *
 * Start the Medusa Admin dev server with `npm run admin:dev` from the repository root.
 * Open any product detail page and choose the new "Magento Product" tab to manage the imported data.
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  defineWidgetConfig,
  type DetailWidgetProps,
} from "@medusajs/admin-sdk"
import type { AdminProduct } from "@medusajs/types"
import {
  Button,
  CodeBlock,
  Container,
  Heading,
  Input,
  Select,
  Switch,
  Table,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"

type MagentoBackendType = "varchar" | "int" | "text" | "decimal" | "datetime"

type MagentoMediaItem = {
  url: string
  label?: string
  position?: number | null
}

type MagentoCategory = {
  id?: number | string | null
  name?: string | null
  magento_id?: number | string | null
}

type MagentoCollection = {
  id?: number | string | null
  title?: string | null
  magento_id?: number | string | null
}

type MagentoTag = {
  value: string
}

type MagentoAttribute = {
  attribute_code: string
  backend_type: MagentoBackendType
  label?: string | null
  value: string | number | boolean | null
  magento_attribute_id?: number
}

type MagentoProductMetadata = {
  sku: string
  description_html: string
  subtitle: string
  handle: string
  discountable: boolean
  media: MagentoMediaItem[]
  categories: MagentoCategory[]
  collections: MagentoCollection[]
  tags: MagentoTag[]
  attributes: MagentoAttribute[]
  raw_json: unknown
}

const backendTypeOptions: MagentoBackendType[] = [
  "varchar",
  "int",
  "text",
  "decimal",
  "datetime",
]

const defaultMagento = (): MagentoProductMetadata => ({
  sku: "",
  description_html: "",
  subtitle: "",
  handle: "",
  discountable: true,
  media: [],
  categories: [],
  collections: [],
  tags: [],
  attributes: [],
  raw_json: null,
})

const MagentoProductTab = ({
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  const [draft, setDraft] = useState<MagentoProductMetadata>(() =>
    parseMagentoMetadata(product.metadata)
  )
  const [baseline, setBaseline] = useState<MagentoProductMetadata>(() =>
    parseMagentoMetadata(product.metadata)
  )
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const next = parseMagentoMetadata(product.metadata)
    setDraft(next)
    setBaseline(next)
  }, [product.metadata])

  const isDirty = useMemo(() => {
    return JSON.stringify(baseline) !== JSON.stringify(draft)
  }, [baseline, draft])

  const jsonPreview = useMemo(() => safeStringify(draft), [draft])

  const updateField = useCallback(
    (key: keyof MagentoProductMetadata, value: any) => {
      setDraft((prev) => ({
        ...prev,
        [key]: value,
      }))
    },
    []
  )

  const updateMediaItem = useCallback(
    (index: number, key: keyof MagentoMediaItem, value: string) => {
      setDraft((prev) => {
        const next = [...prev.media]
        next[index] = {
          ...next[index],
          [key]:
            key === "position"
              ? coerceNumber(value, next[index]?.position ?? index + 1)
              : value,
        }
        return {
          ...prev,
          media: next,
        }
      })
    },
    []
  )

  const updateCategory = useCallback(
    (index: number, key: keyof MagentoCategory, value: string) => {
      setDraft((prev) => {
        const next = [...prev.categories]
        next[index] = {
          ...next[index],
          [key]: key === "magento_id" ? value.trim() : value,
        }
        return {
          ...prev,
          categories: next,
        }
      })
    },
    []
  )

  const updateCollection = useCallback(
    (index: number, key: keyof MagentoCollection, value: string) => {
      setDraft((prev) => {
        const next = [...prev.collections]
        next[index] = {
          ...next[index],
          [key]: key === "magento_id" ? value.trim() : value,
        }
        return {
          ...prev,
          collections: next,
        }
      })
    },
    []
  )

  const updateTag = useCallback((index: number, value: string) => {
    setDraft((prev) => {
      const next = [...prev.tags]
      next[index] = { value }
      return {
        ...prev,
        tags: next,
      }
    })
  }, [])

  const updateAttribute = useCallback(
    (
      index: number,
      key: keyof MagentoAttribute,
      value: string | MagentoBackendType
    ) => {
      setDraft((prev) => {
        const next = [...prev.attributes]
        next[index] = {
          ...next[index],
          [key]:
            key === "backend_type"
              ? (value as MagentoBackendType)
              : key === "value"
                ? value
                : typeof value === "string"
                  ? value
                  : value,
        }
        return {
          ...prev,
          attributes: next,
        }
      })
    },
    []
  )

  const handleSave = useCallback(async () => {
    const payload = sanitizeMagentoPayload(draft)

    setIsSaving(true)
    try {
      const res = await fetch(`/admin/products/${product.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metadata: {
            ...(product.metadata ?? {}),
            magento: payload,
          },
        }),
      })

      if (!res.ok) {
        const message = await res.text()
        throw new Error(
          message || `Unable to save Magento data (status ${res.status}).`
        )
      }

      const body = await res.json().catch(() => null)
      const updatedMeta =
        (body?.product?.metadata?.magento as MagentoProductMetadata | undefined) ??
        payload

      setDraft(updatedMeta)
      setBaseline(updatedMeta)
      toast.success("Magento product saved.")
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save Magento data."
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }, [draft, product.id, product.metadata])

  return (
    <Container className="flex flex-col gap-y-6">
      <div className="flex flex-col gap-y-1">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Heading level="h3">Magento Product</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              Edit data sourced from Magento without touching Medusa core fields.
            </Text>
          </div>
          <Button
            variant="secondary"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
          >
            {isSaving ? "Saving…" : "Save Magento Product"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="flex flex-col gap-6">
          <section className="rounded-lg border border-ui-border-base bg-ui-bg-component p-6 shadow-card">
            <Heading level="h4" className="mb-4 text-base">
              Product information
            </Heading>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="SKU">
                <Input
                  value={draft.sku}
                  onChange={(event) => updateField("sku", event.target.value)}
                  placeholder="Magento SKU"
                />
              </Field>
              <Field label="Handle / URL key">
                <Input
                  value={draft.handle}
                  onChange={(event) =>
                    updateField("handle", event.target.value)
                  }
                  placeholder="original Magento URL key"
                />
              </Field>
              <Field label="Subtitle">
                <Input
                  value={draft.subtitle}
                  onChange={(event) =>
                    updateField("subtitle", event.target.value)
                  }
                  placeholder="Short description shown in Magento"
                />
              </Field>
              <Field label="Discountable" inline>
                <Switch
                  checked={draft.discountable}
                  onCheckedChange={(checked) =>
                    updateField("discountable", !!checked)
                  }
                />
              </Field>
            </div>
            <Field label="Description HTML" className="mt-4">
              <Textarea
                rows={6}
                value={draft.description_html}
                onChange={(event) =>
                  updateField("description_html", event.target.value)
                }
                placeholder="<p>Magento's HTML description…</p>"
              />
            </Field>
          </section>

          <section className="rounded-lg border border-ui-border-base bg-ui-bg-component p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <Heading level="h4" className="text-base">
                Media
              </Heading>
              <Button
                size="small"
                variant="secondary"
                onClick={() =>
                  updateField("media", [
                    ...draft.media,
                    {
                      url: "",
                      label: "",
                      position: draft.media.length + 1,
                    },
                  ])
                }
              >
                Add media
              </Button>
            </div>
            {draft.media.length === 0 ? (
              <EmptyState text="No Magento media found yet." />
            ) : (
              <div className="flex flex-col gap-4">
                {draft.media.map((item, index) => (
                  <div
                    key={`media-${index}`}
                    className="rounded-md border border-dashed border-ui-border-base p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <Text className="font-medium">
                        Media #{index + 1}
                      </Text>
                      <Button
                        size="small"
                        variant="transparent"
                        onClick={() =>
                          updateField(
                            "media",
                            draft.media.filter((_, idx) => idx !== index)
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        value={item.url}
                        placeholder="https://…"
                        onChange={(event) =>
                          updateMediaItem(index, "url", event.target.value)
                        }
                      />
                      <Input
                        value={item.label ?? ""}
                        placeholder="Label"
                        onChange={(event) =>
                          updateMediaItem(index, "label", event.target.value)
                        }
                      />
                      <Input
                        type="number"
                        value={
                          typeof item.position === "number"
                            ? String(item.position)
                            : ""
                        }
                        placeholder="Position"
                        onChange={(event) =>
                          updateMediaItem(index, "position", event.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-ui-border-base bg-ui-bg-component p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between gap-4">
              <Heading level="h4" className="text-base">
                Magento attributes
              </Heading>
              <Button
                size="small"
                variant="secondary"
                onClick={() =>
                  updateField("attributes", [
                    ...draft.attributes,
                    {
                      attribute_code: "",
                      backend_type: "varchar",
                      label: "",
                      value: "",
                    },
                  ])
                }
              >
                Add attribute
              </Button>
            </div>
            {draft.attributes.length === 0 ? (
              <EmptyState text="No Magento attributes captured yet." />
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[720px]">
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Code</Table.HeaderCell>
                      <Table.HeaderCell>Label</Table.HeaderCell>
                      <Table.HeaderCell>Backend type</Table.HeaderCell>
                      <Table.HeaderCell>Value</Table.HeaderCell>
                      <Table.HeaderCell className="w-24 text-right">
                        Actions
                      </Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {draft.attributes.map((attribute, index) => (
                      <Table.Row key={`${attribute.attribute_code}-${index}`}>
                        <Table.Cell>
                          <Input
                            value={attribute.attribute_code}
                            placeholder="attribute_code"
                            onChange={(event) =>
                              updateAttribute(
                                index,
                                "attribute_code",
                                event.target.value
                              )
                            }
                          />
                        </Table.Cell>
                        <Table.Cell>
                          <Input
                            value={attribute.label ?? ""}
                            placeholder="Label"
                            onChange={(event) =>
                              updateAttribute(
                                index,
                                "label",
                                event.target.value
                              )
                            }
                          />
                        </Table.Cell>
                        <Table.Cell>
                          <Select
                            value={attribute.backend_type}
                            onValueChange={(value) =>
                              updateAttribute(
                                index,
                                "backend_type",
                                value as MagentoBackendType
                              )
                            }
                          >
                            <Select.Trigger className="w-full">
                              <Select.Value placeholder="Backend type" />
                            </Select.Trigger>
                            <Select.Content>
                              {backendTypeOptions.map((type) => (
                                <Select.Item key={type} value={type}>
                                  {type}
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select>
                        </Table.Cell>
                        <Table.Cell>
                          <Input
                            value={
                              attribute.value === null
                                ? ""
                                : String(attribute.value)
                            }
                            placeholder="Value"
                            onChange={(event) =>
                              updateAttribute(
                                index,
                                "value",
                                event.target.value
                              )
                            }
                          />
                        </Table.Cell>
                        <Table.Cell className="text-right">
                          <Button
                            variant="transparent"
                            size="small"
                            onClick={() =>
                              updateField(
                                "attributes",
                                draft.attributes.filter(
                                  (_, idx) => idx !== index
                                )
                              )
                            }
                          >
                            Delete
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-ui-border-base bg-ui-bg-component p-6 shadow-card">
            <Heading level="h4" className="mb-4 text-base">
              Magento metadata / JSON
            </Heading>
            <CodeBlock
              className="rounded-lg border border-ui-border-subtle"
              snippets={[
                {
                  label: "magento",
                  language: "json",
                  code: jsonPreview,
                },
              ]}
            />
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <RightColumnCard
            title="Categories"
            description="Replicates Magento category assignments."
          >
            {draft.categories.length === 0 ? (
              <EmptyState text="No categories mapped." />
            ) : (
              <div className="flex flex-col gap-3">
                {draft.categories.map((category, index) => (
                  <div
                    key={`category-${index}`}
                    className="rounded-md border border-ui-border-subtle p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <Text className="text-xs uppercase text-ui-fg-subtle">
                        Category #{index + 1}
                      </Text>
                      <Button
                        variant="transparent"
                        size="small"
                        onClick={() =>
                          updateField(
                            "categories",
                            draft.categories.filter((_, idx) => idx !== index)
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Input
                        value={category.name ?? ""}
                        placeholder="Category name"
                        onChange={(event) =>
                          updateCategory(index, "name", event.target.value)
                        }
                      />
                      <Input
                        value={category.magento_id?.toString() ?? ""}
                        placeholder="Magento category ID"
                        onChange={(event) =>
                          updateCategory(index, "magento_id", event.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button
              className="w-full"
              variant="secondary"
              size="small"
              onClick={() =>
                updateField("categories", [
                  ...draft.categories,
                  { name: "", magento_id: "" },
                ])
              }
            >
              Add category
            </Button>
          </RightColumnCard>

          <RightColumnCard
            title="Collections"
            description="Optional Magento collections or groupings."
          >
            {draft.collections.length === 0 ? (
              <EmptyState text="No collections assigned." />
            ) : (
              <div className="flex flex-col gap-3">
                {draft.collections.map((collection, index) => (
                  <div
                    key={`collection-${index}`}
                    className="rounded-md border border-ui-border-subtle p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <Text className="text-xs uppercase text-ui-fg-subtle">
                        Collection #{index + 1}
                      </Text>
                      <Button
                        variant="transparent"
                        size="small"
                        onClick={() =>
                          updateField(
                            "collections",
                            draft.collections.filter((_, idx) => idx !== index)
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Input
                        value={collection.title ?? ""}
                        placeholder="Collection title"
                        onChange={(event) =>
                          updateCollection(index, "title", event.target.value)
                        }
                      />
                      <Input
                        value={collection.magento_id?.toString() ?? ""}
                        placeholder="Magento collection ID"
                        onChange={(event) =>
                          updateCollection(
                            index,
                            "magento_id",
                            event.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button
              className="w-full"
              variant="secondary"
              size="small"
              onClick={() =>
                updateField("collections", [
                  ...draft.collections,
                  { title: "", magento_id: "" },
                ])
              }
            >
              Add collection
            </Button>
          </RightColumnCard>

          <RightColumnCard
            title="Tags"
            description="Free-form keywords synced from Magento."
          >
            {draft.tags.length === 0 ? (
              <EmptyState text="No tags saved." />
            ) : (
              <div className="flex flex-col gap-3">
                {draft.tags.map((tag, index) => (
                  <div
                    key={`tag-${index}`}
                    className="flex items-center gap-2"
                  >
                    <Input
                      value={tag.value}
                      placeholder="Tag value"
                      onChange={(event) =>
                        updateTag(index, event.target.value)
                      }
                    />
                    <Button
                      variant="transparent"
                      size="small"
                      onClick={() =>
                        updateField(
                          "tags",
                          draft.tags.filter((_, idx) => idx !== index)
                        )
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Button
              className="w-full"
              variant="secondary"
              size="small"
              onClick={() =>
                updateField("tags", [...draft.tags, { value: "" }])
              }
            >
              Add tag
            </Button>
          </RightColumnCard>
        </aside>
      </div>
    </Container>
  )
}

type FieldProps = React.PropsWithChildren<{
  label: string
  className?: string
  inline?: boolean
}>

const Field = ({ label, className, inline, children }: FieldProps) => {
  const layout = inline ? "flex-row items-center gap-3" : "flex-col gap-2"
  return (
    <label className={`flex text-sm ${layout} ${className ?? ""}`}>
      <span className="text-ui-fg-subtle">{label}</span>
      {children}
    </label>
  )
}

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-md border border-dashed border-ui-border-base p-6 text-sm text-ui-fg-muted">
    {text}
  </div>
)

type RightColumnCardProps = React.PropsWithChildren<{
  title: string
  description?: string
}>

const RightColumnCard = ({
  title,
  description,
  children,
}: RightColumnCardProps) => (
  <section className="rounded-lg border border-ui-border-base bg-ui-bg-component p-5 shadow-card">
    <Heading level="h5" className="text-base">
      {title}
    </Heading>
    {description && (
      <Text size="small" className="mt-1 text-ui-fg-subtle">
        {description}
      </Text>
    )}
    <div className="mt-4 flex flex-col gap-4">{children}</div>
  </section>
)

const parseMagentoMetadata = (
  metadata: AdminProduct["metadata"]
): MagentoProductMetadata => {
  const raw = (metadata?.magento ?? {}) as Partial<MagentoProductMetadata>
  return {
    ...defaultMagento(),
    ...raw,
    sku: typeof raw.sku === "string" ? raw.sku : "",
    description_html:
      typeof raw.description_html === "string" ? raw.description_html : "",
    subtitle: typeof raw.subtitle === "string" ? raw.subtitle : "",
    handle: typeof raw.handle === "string" ? raw.handle : "",
    discountable:
      typeof raw.discountable === "boolean" ? raw.discountable : true,
    media: normalizeArray(raw.media).map((item, index) => ({
      url: typeof item?.url === "string" ? item.url : "",
      label: typeof item?.label === "string" ? item.label : undefined,
      position:
        typeof item?.position === "number"
          ? item.position
          : coerceNumber(item?.position, index + 1),
    })),
    categories: normalizeArray(raw.categories).map((category) => ({
      name: typeof category?.name === "string" ? category.name : "",
      id: category?.id ?? category?.magento_id ?? null,
      magento_id: category?.magento_id ?? category?.id ?? null,
    })),
    collections: normalizeArray(raw.collections).map((collection) => ({
      title: typeof collection?.title === "string" ? collection.title : "",
      id: collection?.id ?? collection?.magento_id ?? null,
      magento_id: collection?.magento_id ?? collection?.id ?? null,
    })),
    tags: normalizeArray(raw.tags).map((tag) => ({
      value: typeof tag?.value === "string" ? tag.value : "",
    })),
    attributes: normalizeArray(raw.attributes).map((attribute) => ({
      attribute_code:
        typeof attribute?.attribute_code === "string"
          ? attribute.attribute_code
          : "",
      backend_type: backendTypeOptions.includes(
        attribute?.backend_type as MagentoBackendType
      )
        ? (attribute!.backend_type as MagentoBackendType)
        : "varchar",
      label: typeof attribute?.label === "string" ? attribute.label : "",
      value:
        typeof attribute?.value === "string" ||
        typeof attribute?.value === "number" ||
        typeof attribute?.value === "boolean"
          ? attribute.value
          : attribute?.value === null
            ? null
            : "",
      magento_attribute_id: attribute?.magento_attribute_id,
    })),
    raw_json: raw.raw_json ?? null,
  }
}

const normalizeArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) {
    return value as T[]
  }
  return []
}

const coerceNumber = (value: unknown, fallback: number): number => {
  const parsed = typeof value === "string" ? Number(value) : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const sanitizeMagentoPayload = (
  payload: MagentoProductMetadata
): MagentoProductMetadata => {
  return {
    ...payload,
    sku: payload.sku.trim(),
    subtitle: payload.subtitle.trim(),
    handle: payload.handle.trim(),
    description_html: payload.description_html.trim(),
    media: payload.media
      .map((item, index) => ({
        url: item.url.trim(),
        label: item.label?.trim() || undefined,
        position: Number.isFinite(item.position)
          ? item.position
          : index + 1,
      }))
      .filter((item) => item.url.length > 0),
    categories: payload.categories
      .map((category) => ({
        ...category,
        name: category.name?.toString().trim() ?? "",
        magento_id: category.magento_id ?? category.id ?? null,
      }))
      .filter((category) => category.name?.length),
    collections: payload.collections
      .map((collection) => ({
        ...collection,
        title: collection.title?.toString().trim() ?? "",
        magento_id: collection.magento_id ?? collection.id ?? null,
      }))
      .filter((collection) => collection.title?.length),
    tags: payload.tags
      .map((tag) => ({ value: tag.value.trim() }))
      .filter((tag) => tag.value.length),
    attributes: payload.attributes
      .map((attribute) => ({
        ...attribute,
        attribute_code: attribute.attribute_code.trim(),
        label: attribute.label?.trim() || undefined,
        value:
          attribute.value === null
            ? null
            : typeof attribute.value === "string"
              ? attribute.value.trim()
              : attribute.value,
      }))
      .filter((attribute) => attribute.attribute_code.length),
  }
}

const safeStringify = (value: unknown) => {
  try {
    return JSON.stringify(value ?? {}, null, 2)
  } catch {
    return "// Unable to render Magento JSON payload"
  }
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default MagentoProductTab
