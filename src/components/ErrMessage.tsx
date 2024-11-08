export function ErrMessage(err_code: number, language: 'zh' | 'en' | 'ja', region: number) {
  const gw = (
    <a
      className="underline"
      style={{ color: "#0070f0" }}
      href={region ? "https://302.ai/" : "https://302ai.cn/"}
      target="_blank"
    >
      302.AI
    </a>
  );
  switch (err_code) {
    case -10001:
      return language === 'zh' ? (
        <div className="font-bold">缺少 302 API 密钥</div>
      ) : language === 'ja' ? (
        <div className="font-bold">302 APIキーがありません</div>
      ) : (
        <div className="font-bold">Missing 302 API key</div>
      );
    case -10002:
      return language === 'zh' ? (
        <div className="font-bold">该工具已禁用/删除，更多请访问 {gw}</div>
      ) : language === 'ja' ? (
        <div className="font-bold">このツールは無効化されました/削除されました。詳細については{gw}をご参照ください。</div>
      ) : (
        <div className="font-bold">This tool is disabled / deleted, Please refer to {gw} for details.</div>
      );

    case -10003:
      return language === 'zh' ? (
        <div className="font-bold">网络错误，请稍后重试</div>
      ) : language === 'ja' ? (
        <div className="font-bold">ネットワークエラーが発生しました。後でもう一度お試しください。</div>
      ) : (
        <div className="font-bold">Network error, please try again later.</div>
      );
    case -10004:
      return language === 'zh' ? (
        <div className="font-bold">
          账户余额不足，创建属于自己的工具，更多请访问 {gw}
        </div>
      ) : language === 'ja' ? (
        <div className="font-bold">
          アカウントの残高が不足しています。独自のツールを作成するには{gw}をご覧ください。
        </div>
      ) : (
        <div className="font-bold">
          Insufficient account balance, Please view {gw} to create your own tools.
        </div>
      );
    case -10005:
      return language === 'zh' ? (
        <div className="font-bold">账户凭证过期</div>
      ) : language === 'ja' ? (
        <div className="font-bold">アカウントの証明が期限切れです</div>
      ) : (
        <div className="font-bold">Account credentials expired</div>
      );
    case -10006:
      return language === 'zh' ? (
        <div className="font-bold">账户总额度已达上限，更多请访问 {gw}</div>
      ) : language === 'ja' ? (
        <div className="font-bold">このツールの総クォータが最大限度に達しました。詳細については{gw}をご参照ください。</div>
      ) : (
        <div className="font-bold">
          This tool's total quota reached maximum limit, Please refer to {gw} for details.
        </div>
      );
    case -10007:
      return language === 'zh' ? (
        <div className="font-bold">账户日额度已达上限，更多请访问 {gw}</div>
      ) : language === 'ja' ? (
        <div className="font-bold">このツールの日次クォータが最大限度に達しました。詳細については{gw}をご参照ください。</div>
      ) : (
        <div className="font-bold">
          This tool's daily quota reached maximum limit, Please refer to {gw} for details.
        </div>
      );
    case -10008:
      return language === 'zh' ? (
        <div className="font-bold">当前无可用通道，更多请访问 {gw}</div>
      ) : language === 'ja' ? (
        <div className="font-bold">現在利用可能なチャネルがありません。詳細については{gw}をご参照ください。</div>
      ) : (
        <div className="font-bold">
          No available channels at the moment, Please refer to {gw} for details.
        </div>
      );
    case -10009:
      return language === 'zh' ? (
        <div className="font-bold">不支持当前API功能，更多请访问 {gw}</div>
      ) : language === 'ja' ? (
        <div className="font-bold">現在のAPI機能はサポートされていません。詳細については{gw}をご参照ください。</div>
      ) : (
        <div className="font-bold">
          API function is not supported, Please refer to {gw} for details.
        </div>
      );
    case -10012:
      return language === 'zh' ? (
        <div className="font-bold">
          该免费工具在本小时的额度已达上限,请访问 {gw} 生成属于自己的工具
        </div>
      ) : language === 'ja' ? (
        <div className="font-bold">
          この無料ツールは今時間の上限に達しました。{gw} を訪問して自分のツールを作成してください
        </div>
      ) : (
        <div className="font-bold">
          This free tool's hour quota reached maximum limit. Please view {gw} to create your own tool
        </div>
      );
    case -1024:
      return language === 'zh' ? (
        <div className="font-bold">
          AI接口连接超时， 请稍后重试或者联系 {gw}
        </div>
      ) : language === 'ja' ? (
        <div className="font-bold">
          AIインターフェイスの接続がタイムアウトしました。後でもう一度お試しください。または{gw}に連絡してください。
        </div>
      ) : (
        <div className="font-bold">
          AI interface connection timeout, please try again later or contact {gw}
        </div>
      );
    default:
      return language === 'zh' ? (
        <div className="font-bold ml-2">未知错误，更多请访问 {gw}</div>
      ) : language === 'ja' ? (
        <div className="font-bold ml-2">不明なエラーが発生しました。詳細については{gw}をご参照ください。</div>
      ) : (
        <div className="font-bold ml-2">
          Unknown Error, Please refer to {gw} for details.
        </div>
      );
  }
}
