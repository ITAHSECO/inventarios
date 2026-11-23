const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

class ConfigCapturaService {
  async getAll() {
    const { data, error } = await supabaseAdmin
      .from('config_campos_captura')
      .select('*')
      .order('campo');

    if (error) throw ApiError.internal(error.message);
    return data || [];
  }

  async update(campos, userId) {
    logger.info({ count: campos.length, userId }, '[ConfigCapturaService] Update');

    const results = [];
    for (const item of campos) {
      const { data, error } = await supabaseAdmin
        .from('config_campos_captura')
        .update({
          activo: item.activo,
          obligatorio: item.obligatorio,
          updated_at: new Date().toISOString(),
          updated_by: userId,
        })
        .eq('campo', item.campo)
        .select()
        .single();

      if (error) {
        throw ApiError.internal(`Error actualizando campo ${item.campo}: ${error.message}`);
      }
      results.push(data);
    }

    return results;
  }
}

module.exports = new ConfigCapturaService();
