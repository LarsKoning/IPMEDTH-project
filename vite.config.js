import basicSsl from '@vitejs/plugin-basic-ssl';

export default {
  plugins: [basicSsl()],
  server: {
    host: '0.0.0.0', // Zorgt ervoor dat het op alle netwerken toegankelijk is
    https: true, // Schakelt HTTPS in
  },
};
