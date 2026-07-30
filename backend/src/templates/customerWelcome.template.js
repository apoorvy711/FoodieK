const customerWelcomeTemplate = (customerName) => {
  return {
    subject: "🍔 Welcome to FoodieK!",
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">

        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">

              <table width="600" cellpadding="0" cellspacing="0"
                style="background:#ffffff;margin-top:40px;border-radius:10px;overflow:hidden;">

                <tr>
                  <td
                    style="background:#ff6b35;color:white;padding:30px;text-align:center;font-size:30px;font-weight:bold;">
                    🍔 FoodieK
                  </td>
                </tr>

                <tr>
                  <td style="padding:40px;">

                    <h2>Hi ${customerName}, 👋</h2>

                    <p>
                      Welcome to <strong>FoodieK</strong>.
                    </p>

                    <p>
                      We're excited to have you as a part of our food-loving community.
                    </p>

                    <p>
                      Discover restaurants, explore food reels and enjoy delicious meals around you.
                    </p>

                    <br>

                    <div style="text-align:center;">

                      <a href="http://localhost:5173"
                        style="
                          background:#ff6b35;
                          color:white;
                          text-decoration:none;
                          padding:14px 28px;
                          border-radius:8px;
                          display:inline-block;
                          font-weight:bold;
                        ">

                        Explore FoodieK

                      </a>

                    </div>

                    <br>

                    <p>
                      Happy Eating ❤️
                    </p>

                    <p>
                      <strong>Team FoodieK</strong>
                    </p>

                  </td>
                </tr>

              </table>

            </td>
          </tr>
        </table>

      </body>
      </html>
    `,
  };
};

module.exports = customerWelcomeTemplate;
