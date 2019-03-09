var pdf = require("html-pdf");
exports.createPDFProtocolFile = function(template, options, reg ,res) {
  if (reg && Array.isArray(reg)) {
    reg.forEach(item => {
      template = template.replace(item.relus, item.match);
    });
  }
  pdf.create(template, options).toStream((err, stream) => {
    if (err) return res.end(err.stack); 
    res.setHeader("Content-type", "application/pdf");
    stream.pipe(res);
  });;
};
