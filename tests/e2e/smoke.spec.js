/* eslint-env node */
import { expect, test } from '@playwright/test'

test('admin console rejects unauthenticated visitors', async ({ page }) => {
  await page.goto('/admin/dashboard')
  await expect(page).toHaveURL(/\/admin\/login$/)
  await expect(page.getByRole('heading', { name: 'Admin Login' })).toBeVisible()
})

test('admin login requires a valid email and password', async ({ page }) => {
  await page.goto('/admin/login')
  await expect(page.getByLabel('Email')).toHaveAttribute('type', 'email')
  await expect(page.getByLabel('Password')).toHaveAttribute('type', 'password')
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible()
})

test('storefront search keeps the query in the URL', async ({ page }) => {
  await page.goto('/')
  const search = page.getByPlaceholder('Search pottery, ceramics, artisan crafts...')
  await search.fill('blue mug')
  await search.press('Enter')
  await expect(page).toHaveURL(/\/products\/All%20products\?search=blue(?:%20|\+)mug$/)
  await expect(page.getByText('Search results for “blue mug”')).toBeVisible()
})

test('checkout and product requests require customer authentication', async ({ page }) => {
  await page.goto('/checkout')
  await expect(page).toHaveURL(/\/login\?redirect=(?:%2F|\/)checkout$/)
  await page.goto('/request-product')
  await expect(page).toHaveURL(/\/login\?redirect=(?:%2F|\/)request-product$/)
})
