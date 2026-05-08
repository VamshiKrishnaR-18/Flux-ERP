import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer';

import type {
  Invoice,
  InvoiceItem,
  SettingsDTO,
} from '@erp/types';

Font.register({
  family: 'Helvetica',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/helvetica/v1/0.ttf',
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563EB',
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#111',
  },

  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  label: {
    fontSize: 8,
    color: '#666',
    marginBottom: 2,
  },

  value: {
    fontSize: 10,
    fontWeight: 'bold',
  },

  table: {
    width: '100%',
    marginTop: 20,
    marginBottom: 20,
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderBottom: '1px solid #E5E7EB',
  },

  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1px solid #E5E7EB',
  },

  col1: {
    width: '40%',
  },

  col2: {
    width: '20%',
    textAlign: 'right',
  },

  col3: {
    width: '20%',
    textAlign: 'right',
  },

  col4: {
    width: '20%',
    textAlign: 'right',
  },

  totals: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },

  totalRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },

  totalLabel: {
    width: 100,
    textAlign: 'right',
    paddingRight: 10,
    color: '#666',
  },

  totalValue: {
    width: 80,
    textAlign: 'right',
    fontWeight: 'bold',
  },

  grandTotal: {
    width: 80,
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 12,
    color: '#2563EB',
  },
});

interface InvoicePDFProps {
  invoice: Invoice;
  settings?: SettingsDTO;
}

export const InvoicePDF = ({
  invoice,
  settings,
}: InvoicePDFProps) => {
  const client = invoice?.clientId as unknown as {
    name?: string;
    email?: string;
  };

  const items = invoice?.items || [];

  const primaryColor =
    settings?.primaryColor || '#2563EB';

  const logoUrl = settings?.logo
    ? `http://localhost:3001${settings.logo}`
    : null;

  const dynamicStyles = StyleSheet.create({
    logo: {
      fontSize: 20,
      fontWeight: 'bold',
      color: primaryColor,
    },

    grandTotal: {
      width: 80,
      textAlign: 'right',
      fontWeight: 'bold',
      fontSize: 12,
      color: primaryColor,
    },

    stamp: {
      color: primaryColor,
      borderColor: primaryColor,
    },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {logoUrl ? (
              <Image
                src={logoUrl}
                style={{
                  width: 100,
                  marginBottom: 10,
                }}
              />
            ) : (
              <Text
                style={[
                  styles.logo,
                  dynamicStyles.logo,
                ]}
              >
                {settings?.companyName ||
                  'My Company'}
              </Text>
            )}

            <Text
              style={{
                marginTop: 4,
                color: '#666',
              }}
            >
              {settings?.companyAddress || ''}
            </Text>

            <Text
              style={{
                color: '#666',
              }}
            >
              {settings?.companyEmail || ''}
            </Text>
          </View>

          <View
            style={{
              alignItems: 'flex-end',
            }}
          >
            <Text style={styles.title}>
              INVOICE
            </Text>

            <Text
              style={{
                color: '#666',
                marginTop: 4,
              }}
            >
              #{invoice?.number || 'N/A'}
            </Text>

            <Text
              style={{
                color: '#666',
              }}
            >
              Status:{' '}
              {invoice?.status || 'Unknown'}
            </Text>
          </View>
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: '#E5E7EB',
            marginBottom: 20,
          }}
        />

        {/* Client & Dates */}
        <View style={styles.section}>
          <View>
            <Text style={styles.label}>
              BILL TO
            </Text>

            <Text style={styles.value}>
              {client?.name ||
                'Unknown Client'}
            </Text>

            <Text style={styles.value}>
              {client?.email || ''}
            </Text>
          </View>

          <View
            style={{
              alignItems: 'flex-end',
            }}
          >
            <View
              style={{
                marginBottom: 8,
              }}
            >
              <Text
                style={[
                  styles.label,
                  {
                    textAlign: 'right',
                  },
                ]}
              >
                DATE
              </Text>

              <Text style={styles.value}>
                {invoice?.date
                  ? new Date(
                      invoice.date
                    ).toLocaleDateString()
                  : 'N/A'}
              </Text>
            </View>

            <View>
              <Text
                style={[
                  styles.label,
                  {
                    textAlign: 'right',
                  },
                ]}
              >
                DUE DATE
              </Text>

              <Text style={styles.value}>
                {invoice?.expiredDate
                  ? new Date(
                      invoice.expiredDate
                    ).toLocaleDateString()
                  : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>
              ITEM
            </Text>

            <Text style={styles.col2}>
              QTY
            </Text>

            <Text style={styles.col3}>
              PRICE
            </Text>

            <Text style={styles.col4}>
              TOTAL
            </Text>
          </View>

          {/* Table Rows */}
          {items.map(
            (
              item: InvoiceItem,
              i: number
            ) => (
              <View
                key={i}
                style={styles.tableRow}
              >
                <Text style={styles.col1}>
                  {item?.itemName || 'Item'}
                </Text>

                <Text style={styles.col2}>
                  {Number(
                    item?.quantity || 0
                  )}
                </Text>

                <Text style={styles.col3}>
                  $
                  {Number(
                    item?.price || 0
                  ).toFixed(2)}
                </Text>

                <Text style={styles.col4}>
                  $
                  {(
                    Number(
                      item?.quantity || 0
                    ) *
                    Number(
                      item?.price || 0
                    )
                  ).toFixed(2)}
                </Text>
              </View>
            )
          )}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Subtotal:
              </Text>

              <Text style={styles.totalValue}>
                $
                {Number(
                  invoice?.subTotal || 0
                ).toFixed(2)}
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Tax (
                {Number(
                  invoice?.taxRate || 0
                )}
                %):
              </Text>

              <Text style={styles.totalValue}>
                $
                {Number(
                  invoice?.taxTotal || 0
                ).toFixed(2)}
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Discount:
              </Text>

              <Text style={styles.totalValue}>
                -$
                {Number(
                  invoice?.discount || 0
                ).toFixed(2)}
              </Text>
            </View>

            <View
              style={[
                styles.totalRow,
                {
                  marginTop: 4,
                  borderTop:
                    '1px solid #E5E7EB',
                  paddingTop: 4,
                },
              ]}
            >
              <Text style={styles.totalLabel}>
                Total:
              </Text>

              <Text
                style={[
                  styles.grandTotal,
                  dynamicStyles.grandTotal,
                ]}
              >
                $
                {Number(
                  invoice?.total || 0
                ).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};