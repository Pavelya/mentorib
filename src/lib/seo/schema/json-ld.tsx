type JsonLdValue = Record<string, unknown>;

function serializeJsonLd(value: JsonLdValue | JsonLdValue[]) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

type StructuredDataProps = {
  data: JsonLdValue | JsonLdValue[];
  id: string;
};

export function StructuredData({ id, data }: StructuredDataProps) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(data),
      }}
      id={id}
      type="application/ld+json"
    />
  );
}
