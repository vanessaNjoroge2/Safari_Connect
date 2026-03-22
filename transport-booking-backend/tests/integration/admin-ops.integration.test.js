import test from "node:test";
import assert from "node:assert/strict";
import { startTestServer, stopTestServer, requestJson, loginAs } from "../helpers/http.js";

test("admin support ticket CRUD works", async () => {
  const { server, baseUrl } = await startTestServer();

  try {
    const token = await loginAs(baseUrl, {
      email: "admin@transport.com",
      password: "Password123!",
    });

    const createRes = await requestJson(baseUrl, "/api/admins/support", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject: "Integration test ticket",
        user: "Ops Admin",
        category: "GENERAL",
        priority: "HIGH",
        status: "OPEN",
        assignedTo: "Support Agent",
        description: "Created by integration test",
      }),
    });

    assert.equal(createRes.status, 201);
    const ticketId = createRes.body?.data?.id;
    assert.ok(ticketId, "expected created ticket id");

    const updateRes = await requestJson(baseUrl, `/api/admins/support/${ticketId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "RESOLVED",
      }),
    });

    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body?.data?.status, "Resolved");

    const deleteRes = await requestJson(baseUrl, `/api/admins/support/${ticketId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(deleteRes.status, 200);
    assert.equal(deleteRes.body?.data?.id, ticketId);
  } finally {
    await stopTestServer(server);
  }
});

test("admin notifications CRUD works", async () => {
  const { server, baseUrl } = await startTestServer();

  try {
    const token = await loginAs(baseUrl, {
      email: "admin@transport.com",
      password: "Password123!",
    });

    const createRes = await requestJson(baseUrl, "/api/admins/notifications", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Integration Push",
        message: "Push notification integration test",
        channel: "PUSH",
        targetRole: "ALL",
        status: "DRAFT",
      }),
    });

    assert.equal(createRes.status, 201);
    const notificationId = createRes.body?.data?.id;
    assert.ok(notificationId, "expected created notification id");

    const updateRes = await requestJson(baseUrl, `/api/admins/notifications/${notificationId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "SENT",
      }),
    });

    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body?.data?.status, "Sent");

    const deleteRes = await requestJson(baseUrl, `/api/admins/notifications/${notificationId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(deleteRes.status, 200);
    assert.equal(deleteRes.body?.data?.id, notificationId);
  } finally {
    await stopTestServer(server);
  }
});

test("admin help article CRUD works", async () => {
  const { server, baseUrl } = await startTestServer();

  try {
    const token = await loginAs(baseUrl, {
      email: "admin@transport.com",
      password: "Password123!",
    });

    const createRes = await requestJson(baseUrl, "/api/admins/help", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Integration Help Article",
        category: "Operations",
        content: "Integration test content",
        status: "PUBLISHED",
      }),
    });

    assert.equal(createRes.status, 201);
    const helpId = createRes.body?.data?.id;
    assert.ok(helpId, "expected created help article id");

    const updateRes = await requestJson(baseUrl, `/api/admins/help/${helpId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: "Updated integration help content",
        status: "ARCHIVED",
      }),
    });

    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body?.data?.status, "ARCHIVED");

    const deleteRes = await requestJson(baseUrl, `/api/admins/help/${helpId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(deleteRes.status, 200);
    assert.equal(deleteRes.body?.data?.id, helpId);
  } finally {
    await stopTestServer(server);
  }
});
