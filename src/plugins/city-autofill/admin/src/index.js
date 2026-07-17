export default {
  register(app) {
    app.customFields.register({
      name: 'city-with-uf',
      pluginId: 'city-autofill',
      type: 'string',
      intlLabel: {
        id: 'city-autofill.city-with-uf.label',
        defaultMessage: 'Cidade (UF automática)',
      },
      intlDescription: {
        id: 'city-autofill.city-with-uf.description',
        defaultMessage:
          'Campo de texto que seleciona a UF automaticamente ao digitar uma capital ou estado',
      },
      components: {
        Input: async () => import('./components/CityInput.jsx'),
      },
    });
  },
};
