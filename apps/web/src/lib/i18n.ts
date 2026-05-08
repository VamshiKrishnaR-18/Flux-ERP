import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        translation: {
          common: {
            loading: 'Loading...',
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
            edit: 'Edit',
            actions: 'Actions',
            search: 'Search...',
            no_data: 'No records found',
            error: 'Something went wrong',
            success: 'Success',
            back: 'Go Back',
            download_pdf: 'Download PDF',
            logout: 'Logout',
          },
          sidebar: {
            dashboard: 'Dashboard',
            invoices: 'Invoices',
            quotes: 'Quotes',
            clients: 'Clients',
            products: 'Products',
            expenses: 'Expenses',
            reports: 'Reports',
            activity: 'Activity Logs',
            settings: 'Settings',
            workspace: 'Workspace',
          },
          dashboard: {
            revenue: 'Total Revenue',
            expenses: 'Total Expenses',
            profit: 'Net Profit',
            outstanding: 'Outstanding',
            recent_invoices: 'Recent Invoices',
            quick_actions: 'Quick Actions',
          }
        },
      },
      es: {
        translation: {
          common: {
            loading: 'Cargando...',
            save: 'Guardar',
            cancel: 'Cancelar',
            delete: 'Eliminar',
            edit: 'Editar',
            actions: 'Acciones',
            search: 'Buscar...',
            no_data: 'No se encontraron registros',
            error: 'Algo salió mal',
            success: 'Éxito',
            back: 'Volver',
            download_pdf: 'Descargar PDF',
            logout: 'Cerrar sesión',
          },
          sidebar: {
            dashboard: 'Tablero',
            invoices: 'Facturas',
            quotes: 'Presupuestos',
            clients: 'Clientes',
            products: 'Productos',
            expenses: 'Gastos',
            reports: 'Informes',
            activity: 'Registros',
            settings: 'Ajustes',
            workspace: 'Espacio de trabajo',
          },
          dashboard: {
            revenue: 'Ingresos Totales',
            expenses: 'Gastos Totales',
            profit: 'Beneficio Neto',
            outstanding: 'Pendiente',
            recent_invoices: 'Facturas Recientes',
            quick_actions: 'Acciones Rápidas',
          }
        },
      },
    },
  });

export default i18n;
