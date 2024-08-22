import { expect } from "chai";
import * as nock from "nock";

import * as client from "./client";
import { dataconnectOrigin } from "../api";

describe("DataConnect control plane client", () => {
  afterEach(() => {
    nock.cleanAll();
  });
  describe("deleteServiceAndChildResources", () => {
    it("Should delete all child resources", async () => {
      const testService = "projects/test/locations/us-central1/services/test-service";
      const fake = nock(dataconnectOrigin());
      fake.get(`/v1alpha/${testService}/connectors?pageSize=100&pageToken=&fields=`).reply(200, {
        connectors: [
          { name: `${testService}/connectors/c1` },
          { name: `${testService}/connectors/c2` },
        ],
      });
      fake
        .delete(`/v1alpha/${testService}/connectors/c1`)
        .reply(200, { name: "projects/test/operations/abc123" });
      fake
        .delete(`/v1alpha/${testService}/connectors/c2`)
        .reply(200, { name: "projects/test/operations/def456" });
      fake
        .delete(`/v1alpha/${testService}/schemas/main`)
        .reply(200, { name: "projects/test/operations/ghi123" });
      fake
        .delete(`/v1alpha/${testService}`)
        .reply(200, { name: "projects/test/operations/jkl456" });
      fake.get("/v1alpha/projects/test/operations/abc123").reply(200, { done: true });
      fake.get("/v1alpha/projects/test/operations/def456").reply(200, { done: true });
      fake.get("/v1alpha/projects/test/operations/ghi123").reply(200, { done: true });
      fake.get("/v1alpha/projects/test/operations/jkl456").reply(200, { done: true });

      await client.deleteServiceAndChildResources(testService);

      expect(nock.isDone()).to.be.true;
    });

    it("Succeed when there are no connectors", async () => {
      const testService = "projects/test/locations/us-central1/services/test-service";
      const fake = nock(dataconnectOrigin());
      fake.get(`/v1alpha/${testService}/connectors?pageSize=100&pageToken=&fields=`).reply(200, {
        connectors: [],
      });
      fake
        .delete(`/v1alpha/${testService}/schemas/main`)
        .reply(200, { name: "projects/test/operations/ghi123" });
      fake
        .delete(`/v1alpha/${testService}`)
        .reply(200, { name: "projects/test/operations/jkl456" });
      fake.get("/v1alpha/projects/test/operations/ghi123").reply(200, { done: true });
      fake.get("/v1alpha/projects/test/operations/jkl456").reply(200, { done: true });

      await client.deleteServiceAndChildResources(testService);

      expect(nock.isDone()).to.be.true;
    });

    it("Succeed when there is no schema", async () => {
      const testService = "projects/test/locations/us-central1/services/test-service";
      const fake = nock(dataconnectOrigin());
      fake.get(`/v1alpha/${testService}/connectors?pageSize=100&pageToken=&fields=`).reply(200, {
        connectors: [],
      });
      fake.delete(`/v1alpha/${testService}/schemas/main`).reply(404, {});
      fake
        .delete(`/v1alpha/${testService}`)
        .reply(200, { name: "projects/test/operations/jkl456" });
      fake.get("/v1alpha/projects/test/operations/jkl456").reply(200, { done: true });

      await client.deleteServiceAndChildResources(testService);

      expect(nock.isDone()).to.be.true;
    });
  });
});
