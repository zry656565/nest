import { expect } from 'chai';
import * as sinon from 'sinon';
import { NO_MESSAGE_HANDLER } from '../../constants';
import { ServerTCP } from '../../server/server-tcp';

describe('ServerTCP', () => {
  let server: ServerTCP;

  const objectToMap = obj =>
    new Map(Object.keys(obj).map(key => [key, obj[key]]) as any);

  beforeEach(() => {
    server = new ServerTCP({});
  });

  describe('bindHandler', () => {
    let getSocketInstance;
    const socket = { on: sinon.spy() };
    beforeEach(() => {
      getSocketInstance = sinon
        .stub(server, 'getSocketInstance' as any)
        .callsFake(() => socket);
    });
    it('should bind message event to handler', () => {
      server.bindHandler(null);
      expect(socket.on.called).to.be.true;
    });
  });
  describe('close', () => {
    const tcpServer = { close: sinon.spy() };
    beforeEach(() => {
      (server as any).server = tcpServer;
    });
    it('should close server', () => {
      server.close();
      expect(tcpServer.close.called).to.be.true;
    });
  });
  describe('listen', () => {
    const serverMock = { listen: sinon.spy() };
    beforeEach(() => {
      (server as any).server = serverMock;
    });
    it('should call native listen method with expected arguments', () => {
      const callback = () => {};
      server.listen(callback);
      expect(serverMock.listen.calledWith((server as any).port, callback)).to.be
        .true;
    });
  });
  describe('handleMessage', () => {
    let socket;
    const msg = {
      pattern: 'test',
      data: 'tests',
      id: '3',
    };
    beforeEach(() => {
      socket = {
        sendMessage: sinon.spy(),
      };
    });
    it('should send NO_MESSAGE_HANDLER error if key does not exists in handlers object', () => {
      server.handleMessage(socket, msg);
      expect(
        socket.sendMessage.calledWith({
          id: msg.id,
          status: 'error',
          err: NO_MESSAGE_HANDLER,
        }),
      ).to.be.true;
    });
    it('should call handler if exists in handlers object', () => {
      const handler = sinon.spy();
      (server as any).messageHandlers = objectToMap({
        [msg.pattern]: handler as any,
      });
      server.handleMessage(socket, msg);
      expect(handler.calledOnce).to.be.true;
    });
  });
  describe('handleClose', () => {
    describe('when is terminated', () => {
      it('should return undefined', () => {
        (server as any).isExplicitlyTerminated = true;
        const result = server.handleClose();
        expect(result).to.be.undefined;
      });
    });
    describe('when "retryAttempts" does not exist', () => {
      it('should return undefined', () => {
        (server as any).options.retryAttempts = undefined;
        const result = server.handleClose();
        expect(result).to.be.undefined;
      });
    });
    describe('when "retryAttemptsCount" count is max', () => {
      it('should return undefined', () => {
        (server as any).options.retryAttempts = 3;
        (server as any).retryAttemptsCount = 3;
        const result = server.handleClose();
        expect(result).to.be.undefined;
      });
    });
    describe('otherwise', () => {
      it('should return delay (ms)', () => {
        (server as any).options = {};
        (server as any).isExplicitlyTerminated = false;
        (server as any).options.retryAttempts = 3;
        (server as any).retryAttemptsCount = 2;
        (server as any).options.retryDelay = 3;
        const result = server.handleClose();
        expect(result).to.be.not.undefined;
      });
    });
  });

  describe('handleEvent', () => {
    const channel = 'test';
    const data = 'test';

    it('should call handler with expected arguments', () => {
      const handler = sinon.spy();
      (server as any).messageHandlers = objectToMap({
        [channel]: handler,
      });

      server.handleEvent(channel, { pattern: '', data });
      expect(handler.calledWith(data)).to.be.true;
    });
  });
});
